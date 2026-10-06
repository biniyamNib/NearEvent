package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type DeviceTokenRepository struct {
	db *pgxpool.Pool
}

func NewDeviceTokenRepository(db *pgxpool.Pool) *DeviceTokenRepository {
	return &DeviceTokenRepository{db: db}
}

func (r *DeviceTokenRepository) Upsert(ctx context.Context, userID uuid.UUID, token, platform string) error {
	query := `
		INSERT INTO device_tokens (id, user_id, token, platform, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $5)
		ON CONFLICT (user_id, token)
		DO UPDATE SET platform = EXCLUDED.platform, updated_at = EXCLUDED.updated_at
	`
	now := time.Now().UTC()
	_, err := r.db.Exec(ctx, query, uuid.New(), userID, token, platform, now)
	return err
}

func (r *DeviceTokenRepository) ListByUser(ctx context.Context, userID uuid.UUID) ([]string, error) {
	query := `SELECT token FROM device_tokens WHERE user_id = $1`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	tokens := make([]string, 0)
	for rows.Next() {
		var t string
		if err := rows.Scan(&t); err != nil {
			return nil, err
		}
		tokens = append(tokens, t)
	}
	return tokens, rows.Err()
}

func (r *DeviceTokenRepository) DeleteToken(ctx context.Context, token string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM device_tokens WHERE token = $1`, token)
	return err
}