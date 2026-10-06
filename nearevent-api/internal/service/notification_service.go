package service

import (
	"context"
	"errors"
	"time"

	"nearevent-api/internal/dto"
	"nearevent-api/internal/repository"
	"nearevent-api/internal/realtime"

	"github.com/google/uuid"
)

type NotificationService struct {
	notifications *repository.NotificationRepository
	hub           *realtime.Hub
}

func NewNotificationService(
	notifications *repository.NotificationRepository,
	hub *realtime.Hub,
) *NotificationService {
	return &NotificationService{notifications: notifications, hub: hub}
}

func (s *NotificationService) Create(
	ctx context.Context,
	userID uuid.UUID,
	notifType, title, message string,
	eventID *uuid.UUID,
) error {
	n := repository.NewNotification(userID, notifType, title, message, eventID)
	if err := s.notifications.Create(ctx, n); err != nil {
		return err
	}

	var eventIDStr *string
	if eventID != nil {
		v := eventID.String()
		eventIDStr = &v
	}

	if s.hub != nil {
		s.hub.SendToUser(userID, map[string]any{
			"id":         n.ID.String(),
			"type":       notifType,
			"title":      title,
			"message":    message,
			"event_id":   eventIDStr,
			"is_read":    false,
			"created_at": n.CreatedAt.Format(time.RFC3339),
		})
	}
	return nil
}

func (s *NotificationService) ListMine(ctx context.Context, userID string) ([]dto.NotificationResponse, error) {
	uID, err := uuid.Parse(userID)
	if err != nil {
		return nil, errors.New("invalid user id")
	}

	items, err := s.notifications.ListByUser(ctx, uID)
	if err != nil {
		return nil, err
	}

	result := make([]dto.NotificationResponse, 0, len(items))
	for _, item := range items {
		var eventID *string
		if item.EventID != nil {
			value := item.EventID.String()
			eventID = &value
		}

		result = append(result, dto.NotificationResponse{
			ID:        item.ID.String(),
			Type:      item.Type,
			Title:     item.Title,
			Message:   item.Message,
			EventID:   eventID,
			IsRead:    item.IsRead,
			CreatedAt: item.CreatedAt.Format(time.RFC3339),
		})
	}
	return result, nil
}

func (s *NotificationService) MarkRead(ctx context.Context, userID, notificationID string) error {
	uID, err := uuid.Parse(userID)
	if err != nil {
		return errors.New("invalid user id")
	}
	nID, err := uuid.Parse(notificationID)
	if err != nil {
		return errors.New("invalid notification id")
	}

	return s.notifications.MarkRead(ctx, uID, nID)
}

func (s *NotificationService) MarkAllRead(ctx context.Context, userID string) error {
	uID, err := uuid.Parse(userID)
	if err != nil {
		return errors.New("invalid user id")
	}
	return s.notifications.MarkAllRead(ctx, uID)
}
