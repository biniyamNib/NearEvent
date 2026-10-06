package service

import (
	"context"
	"errors"
	"time"
	"strings"

	"nearevent-api/internal/dto"
	"nearevent-api/internal/repository"
	"nearevent-api/internal/realtime"
	"nearevent-api/internal/push"

	"github.com/google/uuid"
)

type NotificationService struct {
	notifications *repository.NotificationRepository
	deviceTokens  *repository.DeviceTokenRepository
	hub           *realtime.Hub
}

func NewNotificationService(
	notifications *repository.NotificationRepository,
	deviceTokens *repository.DeviceTokenRepository,
	hub *realtime.Hub,
) *NotificationService {
	return &NotificationService{
		notifications: notifications, 
		deviceTokens: deviceTokens,
		hub: hub,
	}
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

	payload := map[string]any{
		"id":         n.ID.String(),
		"type":       notifType,
		"title":      title,
		"message":    message,
		"event_id":   eventIDStr,
		"is_read":    false,
		"created_at": n.CreatedAt.Format(time.RFC3339),
	}


	if s.hub != nil {
		s.hub.SendToUser(userID, payload)
	}

	if s.deviceTokens != nil {
		tokens, err := s.deviceTokens.ListByUser(ctx, userID)
		if err == nil && len(tokens) > 0 {
			push.SendExpo(tokens, title, message, payload)
		}
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

func (s *NotificationService) RegisterDeviceToken(
	ctx context.Context,
	userID string,
	token string,
	platform string,
) error {
	uID, err := uuid.Parse(userID)
	if err != nil {
		return errors.New("invalid user id")
	}
	token = strings.TrimSpace(token)
	if token == "" {
		return errors.New("token is required")
	}
	if strings.TrimSpace(platform) == "" {
		platform = "unknown"
	}
	return s.deviceTokens.Upsert(ctx, uID, token, platform)
}
