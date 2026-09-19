package repository

import (
	"context"
	"errors"
	"time"
	"fmt"
	"strings"

	"nearevent-api/internal/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrUserNotFound = errors.New("user not found")

type UserRepository struct {
	db *pgxpool.Pool
}

type PasswordResetToken struct {
	ID        uuid.UUID
	UserID    uuid.UUID
	TokenHash string
	ExpiresAt time.Time
	UsedAt    *time.Time
}

type UserListFilter struct {
	Role   string 
	Status string 
	Query  string 
}

type AdminUserStats struct {
	TotalUsers      int
	TotalOrganizers int
	TotalAttendees  int
}

func NewUserRepository(db *pgxpool.Pool) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(ctx context.Context, user *models.User) error {
	query := `
		INSERT INTO users (id, full_name, email, password_hash, role, status, avatar_url, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`

	_, err := r.db.Exec(
		ctx,
		query,
		user.ID,
		user.FullName,
		user.Email,
		user.PasswordHash,
		user.Role,
		user.Status,
		user.AvatarURL,
		user.CreatedAt,
		user.UpdatedAt,
	)
	return err
}

func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	query := `
		SELECT id, full_name, email, password_hash, role, status, avatar_url, created_at, updated_at
		FROM users
		WHERE email = $1
	`

	var user models.User
	err := r.db.QueryRow(ctx, query, email).Scan(
		&user.ID,
		&user.FullName,
		&user.Email,
		&user.PasswordHash,
		&user.Role,
		&user.Status,
		&user.AvatarURL,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}

	return &user, nil
}

func (r *UserRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	query := `
		SELECT id, full_name, email, password_hash, role, status, avatar_url, created_at, updated_at
		FROM users
		WHERE id = $1
	`

	var user models.User
	err := r.db.QueryRow(ctx, query, id).Scan(
		&user.ID,
		&user.FullName,
		&user.Email,
		&user.PasswordHash,
		&user.Role,
		&user.Status,
		&user.AvatarURL,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}

	return &user, nil
}

func (r *UserRepository) EmailExists(ctx context.Context, email string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)`

	var exists bool
	err := r.db.QueryRow(ctx, query, email).Scan(&exists)
	return exists, err
}

func NewUser(fullName, email, passwordHash string, role models.UserRole) *models.User {
	now := time.Now().UTC()
	return &models.User{
		ID:           uuid.New(),
		FullName:     fullName,
		Email:        email,
		PasswordHash: passwordHash,
		Role:         role,
		Status:       models.UserStatusActive,
		CreatedAt:    now,
		UpdatedAt:    now,
	}
}

func (r *UserRepository) SavePasswordResetToken(ctx context.Context, userID uuid.UUID, tokenHash string, expiresAt time.Time) error {
	query := `
		INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, created_at)
		VALUES ($1, $2, $3, $4, $5)
	`
	_, err := r.db.Exec(ctx, query, uuid.New(), userID, tokenHash, expiresAt, time.Now().UTC())
	return err
}

func (r *UserRepository) GetValidPasswordResetToken(ctx context.Context, tokenHash string) (*PasswordResetToken, error) {
	query := `
		SELECT id, user_id, token_hash, expires_at, used_at
		FROM password_reset_tokens
		WHERE token_hash = $1
		LIMIT 1
	`

	var t PasswordResetToken
	err := r.db.QueryRow(ctx, query, tokenHash).Scan(
		&t.ID,
		&t.UserID,
		&t.TokenHash,
		&t.ExpiresAt,
		&t.UsedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errors.New("invalid or expired reset token")
		}
		return nil, err
	}

	if t.UsedAt != nil || time.Now().UTC().After(t.ExpiresAt) {
		return nil, errors.New("invalid or expired reset token")
	}

	return &t, nil
}

func (r *UserRepository) MarkPasswordResetTokenUsed(ctx context.Context, tokenID uuid.UUID) error {
	query := `
		UPDATE password_reset_tokens
		SET used_at = $1
		WHERE id = $2
	`
	_, err := r.db.Exec(ctx, query, time.Now().UTC(), tokenID)
	return err
}

func (r *UserRepository) UpdatePassword(ctx context.Context, userID uuid.UUID, passwordHash string) error {
	query := `
		UPDATE users
		SET password_hash = $1, updated_at = $2
		WHERE id = $3
	`
	_, err := r.db.Exec(ctx, query, passwordHash, time.Now().UTC(), userID)
	return err
}

func (r *UserRepository) EnsureAdmin(ctx context.Context, fullName, email, passwordHash string) error {
	exists, err := r.EmailExists(ctx, email)
	if err != nil {
		return err
	}
	if exists {
		return nil
	}

	admin := NewUser(fullName, email, passwordHash, models.RoleAdmin)
	return r.Create(ctx, admin)
}

func (r *UserRepository) List(ctx context.Context, filter UserListFilter) ([]models.User, error) {
	query := `
		SELECT id, full_name, email, password_hash, role, status, avatar_url, created_at, updated_at
		FROM users
		WHERE 1=1
	`
	args := make([]interface{}, 0)
	argN := 1

	if filter.Role != "" && filter.Role != "all" {
		query += fmt.Sprintf(" AND role = $%d", argN)
		args = append(args, filter.Role)
		argN++
	}

	if filter.Status != "" && filter.Status != "all" {
		query += fmt.Sprintf(" AND status = $%d", argN)
		args = append(args, filter.Status)
		argN++
	}

	if strings.TrimSpace(filter.Query) != "" {
		query += fmt.Sprintf(" AND (full_name ILIKE $%d OR email ILIKE $%d)", argN, argN)
		args = append(args, "%"+strings.TrimSpace(filter.Query)+"%")
		argN++
	}

	query += " ORDER BY created_at DESC"

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	users := make([]models.User, 0)
	for rows.Next() {
		var user models.User
		if err := rows.Scan(
			&user.ID,
			&user.FullName,
			&user.Email,
			&user.PasswordHash,
			&user.Role,
			&user.Status,
			&user.AvatarURL,
			&user.CreatedAt,
			&user.UpdatedAt,
		); err != nil {
			return nil, err
		}
		users = append(users, user)
	}
	return users, rows.Err()
}

func (r *UserRepository) UpdateStatus(ctx context.Context, userID uuid.UUID, status models.UserStatus) error {
	query := `
		UPDATE users
		SET status = $1, updated_at = $2
		WHERE id = $3
	`
	cmd, err := r.db.Exec(ctx, query, status, time.Now().UTC(), userID)
	if err != nil {
		return err
	}
	if cmd.RowsAffected() == 0 {
		return ErrUserNotFound
	}
	return nil
}

func (r *UserRepository) CountRegistrationsByUser(ctx context.Context, userID uuid.UUID) (int, error) {
	var count int
	err := r.db.QueryRow(ctx, `
		SELECT COUNT(*) FROM event_registrations
		WHERE user_id = $1 AND status = 'registered'
	`, userID).Scan(&count)
	return count, err
}

func (r *UserRepository) CountSavedByUser(ctx context.Context, userID uuid.UUID) (int, error) {
	var count int
	err := r.db.QueryRow(ctx, `
		SELECT COUNT(*) FROM saved_events WHERE user_id = $1
	`, userID).Scan(&count)
	return count, err
}

func (r *UserRepository) CountEventsByOrganizer(ctx context.Context, organizerID uuid.UUID) (int, error) {
	var count int
	err := r.db.QueryRow(ctx, `
		SELECT COUNT(*) FROM events WHERE organizer_id = $1
	`, organizerID).Scan(&count)
	return count, err
}

func (r *UserRepository) UpdateProfile(ctx context.Context, user *models.User) error {
	query := `
		UPDATE users
		SET full_name = $1,
		    email = $2,
		    avatar_url = $3,
		    updated_at = $4
		WHERE id = $5
	`
	cmd, err := r.db.Exec(
		ctx,
		query,
		user.FullName,
		user.Email,
		user.AvatarURL,
		user.UpdatedAt,
		user.ID,
	)
	if err != nil {
		return err
	}
	if cmd.RowsAffected() == 0 {
		return ErrUserNotFound
	}
	return nil
}

func (r *UserRepository) GetAdminUserStats(ctx context.Context) (*AdminUserStats, error) {
	query := `
		SELECT
			COUNT(*) AS total_users,
			COUNT(*) FILTER (WHERE role = 'organizer') AS total_organizers,
			COUNT(*) FILTER (WHERE role = 'attendee') AS total_attendees
		FROM users
		WHERE role IN ('organizer', 'attendee', 'admin')
	`
	var stats AdminUserStats
	err := r.db.QueryRow(ctx, query).Scan(
		&stats.TotalUsers,
		&stats.TotalOrganizers,
		&stats.TotalAttendees,
	)
	if err != nil {
		return nil, err
	}
	return &stats, nil
}