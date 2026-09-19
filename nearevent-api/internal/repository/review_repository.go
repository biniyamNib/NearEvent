package repository

import (
	"context"
	"errors"
	"time"

	"nearevent-api/internal/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrReviewNotFound      = errors.New("review not found")
	ErrReviewAlreadyExists = errors.New("you have already reviewed this event")
)

type ReviewRepository struct {
	db *pgxpool.Pool
}

func NewReviewRepository(db *pgxpool.Pool) *ReviewRepository {
	return &ReviewRepository{db: db}
}

type ReviewWithUser struct {
	Review
	UserName string
}

// local alias for scanning joined data
type Review struct {
	ID        uuid.UUID
	EventID   uuid.UUID
	UserID    uuid.UUID
	Rating    int
	Comment   *string
	CreatedAt time.Time
	UpdatedAt time.Time
}

func (r *ReviewRepository) Create(ctx context.Context, review *models.Review) error {
	query := `
		INSERT INTO reviews (id, event_id, user_id, rating, comment, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`
	_, err := r.db.Exec(
		ctx,
		query,
		review.ID,
		review.EventID,
		review.UserID,
		review.Rating,
		review.Comment,
		review.CreatedAt,
		review.UpdatedAt,
	)
	return err
}

func (r *ReviewRepository) Exists(ctx context.Context, userID, eventID uuid.UUID) (bool, error) {
	query := `
		SELECT EXISTS(
			SELECT 1 FROM reviews WHERE user_id = $1 AND event_id = $2
		)
	`
	var exists bool
	err := r.db.QueryRow(ctx, query, userID, eventID).Scan(&exists)
	return exists, err
}

func (r *ReviewRepository) ListByEvent(ctx context.Context, eventID uuid.UUID) ([]ReviewWithUser, error) {
	query := `
		SELECT r.id, r.event_id, r.user_id, r.rating, r.comment, r.created_at, r.updated_at, u.full_name
		FROM reviews r
		INNER JOIN users u ON u.id = r.user_id
		WHERE r.event_id = $1
		ORDER BY r.created_at DESC
	`

	rows, err := r.db.Query(ctx, query, eventID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]ReviewWithUser, 0)
	for rows.Next() {
		var item ReviewWithUser
		if err := rows.Scan(
			&item.ID,
			&item.EventID,
			&item.UserID,
			&item.Rating,
			&item.Comment,
			&item.CreatedAt,
			&item.UpdatedAt,
			&item.UserName,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *ReviewRepository) SummaryByEvent(ctx context.Context, eventID uuid.UUID) (float64, int, error) {
	query := `
		SELECT COALESCE(AVG(rating), 0), COUNT(*)
		FROM reviews
		WHERE event_id = $1
	`
	var avg float64
	var count int
	err := r.db.QueryRow(ctx, query, eventID).Scan(&avg, &count)
	return avg, count, err
}

func NewReview(eventID, userID uuid.UUID, rating int, comment *string) *models.Review {
	now := time.Now().UTC()
	return &models.Review{
		ID:        uuid.New(),
		EventID:   eventID,
		UserID:    userID,
		Rating:    rating,
		Comment:   comment,
		CreatedAt: now,
		UpdatedAt: now,
	}
}

// keep pgx available for future not-found checks
var _ = pgx.ErrNoRows