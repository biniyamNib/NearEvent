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

var ErrNotificationNotFound = errors.New("notification not found")

type NotificationRepository struct {
	db *pgxpool.Pool
}

func NewNotificationRepository(db *pgxpool.Pool) *NotificationRepository {
	return &NotificationRepository{db: db}
}

func (r *NotificationRepository) Create(ctx context.Context, n *models.Notification) error {
	query := `
		INSERT INTO notifications (id, user_id, type, title, message, event_id, is_read, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	_, err := r.db.Exec(
		ctx,
		query,
		n.ID,
		n.UserID,
		n.Type,
		n.Title,
		n.Message,
		n.EventID,
		n.IsRead,
		n.CreatedAt,
	)
	return err
}

func (r *NotificationRepository) ListByUser(ctx context.Context, userID uuid.UUID) ([]models.Notification, error) {
	query := `
		SELECT id, user_id, type, title, message, event_id, is_read, created_at
		FROM notifications
		WHERE user_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]models.Notification, 0)
	for rows.Next() {
		var n models.Notification
		if err := rows.Scan(
			&n.ID,
			&n.UserID,
			&n.Type,
			&n.Title,
			&n.Message,
			&n.EventID,
			&n.IsRead,
			&n.CreatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, n)
	}
	return items, rows.Err()
}

func (r *NotificationRepository) MarkRead(ctx context.Context, userID, notificationID uuid.UUID) error {
	query := `
		UPDATE notifications
		SET is_read = TRUE
		WHERE id = $1 AND user_id = $2
	`
	cmd, err := r.db.Exec(ctx, query, notificationID, userID)
	if err != nil {
		return err
	}
	if cmd.RowsAffected() == 0 {
		return ErrNotificationNotFound
	}
	return nil
}

func (r *NotificationRepository) MarkAllRead(ctx context.Context, userID uuid.UUID) error {
	query := `
		UPDATE notifications
		SET is_read = TRUE
		WHERE user_id = $1 AND is_read = FALSE
	`
	_, err := r.db.Exec(ctx, query, userID)
	return err
}

func NewNotification(userID uuid.UUID, notifType, title, message string, eventID *uuid.UUID) *models.Notification {
	return &models.Notification{
		ID:        uuid.New(),
		UserID:    userID,
		Type:      notifType,
		Title:     title,
		Message:   message,
		EventID:   eventID,
		IsRead:    false,
		CreatedAt: time.Now().UTC(),
	}
}

var _ = pgx.ErrNoRows