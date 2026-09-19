package repository

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrSavedEventNotFound = errors.New("saved event not found")

type SavedEventRepository struct {
	db *pgxpool.Pool
}

func NewSavedEventRepository(db *pgxpool.Pool) *SavedEventRepository {
	return &SavedEventRepository{db: db}
}

func (r *SavedEventRepository) Save(ctx context.Context, userID, eventID uuid.UUID) error {
	query := `
		INSERT INTO saved_events (id, event_id, user_id, created_at)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (event_id, user_id) DO NOTHING
	`
	_, err := r.db.Exec(ctx, query, uuid.New(), eventID, userID, time.Now().UTC())
	return err
}

func (r *SavedEventRepository) Unsave(ctx context.Context, userID, eventID uuid.UUID) error {
	query := `
		DELETE FROM saved_events
		WHERE user_id = $1 AND event_id = $2
	`
	cmd, err := r.db.Exec(ctx, query, userID, eventID)
	if err != nil {
		return err
	}
	if cmd.RowsAffected() == 0 {
		return ErrSavedEventNotFound
	}
	return nil
}

func (r *SavedEventRepository) ListByUser(ctx context.Context, userID uuid.UUID) ([]uuid.UUID, error) {
	query := `
		SELECT event_id
		FROM saved_events
		WHERE user_id = $1
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

func (r *SavedEventRepository) IsSaved(ctx context.Context, userID, eventID uuid.UUID) (bool, error) {
	query := `
		SELECT EXISTS(
			SELECT 1 FROM saved_events WHERE user_id = $1 AND event_id = $2
		)
	`
	var exists bool
	err := r.db.QueryRow(ctx, query, userID, eventID).Scan(&exists)
	return exists, err
}

// keep pgx import used if needed by future methods
var _ = pgx.ErrNoRows