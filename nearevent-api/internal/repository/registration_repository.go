package repository

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrRegistrationNotFound = errors.New("registration not found")
	ErrAlreadyRegistered    = errors.New("already registered for this event")
)

type RegistrationRepository struct {
	db *pgxpool.Pool
}

type EventRegistrant struct {
	UserID    uuid.UUID
	FullName  string
	Email     string
	Status    string
	CreatedAt time.Time
}

func NewRegistrationRepository(db *pgxpool.Pool) *RegistrationRepository {
	return &RegistrationRepository{db: db}
}

func (r *RegistrationRepository) CountActiveByEvent(ctx context.Context, eventID uuid.UUID) (int, error) {
	query := `
		SELECT COUNT(*)
		FROM event_registrations
		WHERE event_id = $1 AND status = 'registered'
	`
	var count int
	err := r.db.QueryRow(ctx, query, eventID).Scan(&count)
	return count, err
}

func (r *RegistrationRepository) Get(ctx context.Context, userID, eventID uuid.UUID) (string, error) {
	query := `
		SELECT status
		FROM event_registrations
		WHERE user_id = $1 AND event_id = $2
	`
	var status string
	err := r.db.QueryRow(ctx, query, userID, eventID).Scan(&status)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", ErrRegistrationNotFound
		}
		return "", err
	}
	return status, nil
}

func (r *RegistrationRepository) Register(ctx context.Context, userID, eventID uuid.UUID) error {
	// If a cancelled row exists, reactivate it; otherwise insert new
	query := `
		INSERT INTO event_registrations (id, event_id, user_id, status, created_at, updated_at)
		VALUES ($1, $2, $3, 'registered', $4, $4)
		ON CONFLICT (event_id, user_id)
		DO UPDATE SET status = 'registered', updated_at = EXCLUDED.updated_at
	`
	_, err := r.db.Exec(ctx, query, uuid.New(), eventID, userID, time.Now().UTC())
	return err
}

func (r *RegistrationRepository) Cancel(ctx context.Context, userID, eventID uuid.UUID) error {
	query := `
		UPDATE event_registrations
		SET status = 'cancelled', updated_at = $1
		WHERE user_id = $2 AND event_id = $3 AND status = 'registered'
	`
	cmd, err := r.db.Exec(ctx, query, time.Now().UTC(), userID, eventID)
	if err != nil {
		return err
	}
	if cmd.RowsAffected() == 0 {
		return ErrRegistrationNotFound
	}
	return nil
}

func (r *RegistrationRepository) ListEventIDsByUser(ctx context.Context, userID uuid.UUID) ([]uuid.UUID, error) {
	query := `
		SELECT event_id
		FROM event_registrations
		WHERE user_id = $1 AND status = 'registered'
		ORDER BY created_at DESC
	`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	ids := make([]uuid.UUID, 0)
	for rows.Next() {
		var id uuid.UUID
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, rows.Err()
}

func (r *RegistrationRepository) ListByEvent(ctx context.Context, eventID uuid.UUID) ([]EventRegistrant, error) {
	query := `
		SELECT u.id, u.full_name, u.email, er.status, er.created_at
		FROM event_registrations er
		INNER JOIN users u ON u.id = er.user_id
		WHERE er.event_id = $1 AND er.status = 'registered'
		ORDER BY er.created_at DESC
	`

	rows, err := r.db.Query(ctx, query, eventID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]EventRegistrant, 0)
	for rows.Next() {
		var item EventRegistrant
		if err := rows.Scan(&item.UserID, &item.FullName, &item.Email, &item.Status, &item.CreatedAt); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *RegistrationRepository) ListUserIDsByEvent(ctx context.Context, eventID uuid.UUID) ([]uuid.UUID, error) {
	query := `
		SELECT user_id
		FROM event_registrations
		WHERE event_id = $1 AND status = 'registered'
	`
	rows, err := r.db.Query(ctx, query, eventID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	ids := make([]uuid.UUID, 0)
	for rows.Next() {
		var id uuid.UUID
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, rows.Err()
}