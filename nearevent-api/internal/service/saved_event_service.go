package service

import (
	"context"
	"errors"

	"nearevent-api/internal/dto"
	"nearevent-api/internal/models"
	"nearevent-api/internal/repository"

	"github.com/google/uuid"
)

type SavedEventService struct {
	saved  *repository.SavedEventRepository
	events *repository.EventRepository
}

func NewSavedEventService(
	saved *repository.SavedEventRepository,
	events *repository.EventRepository,
) *SavedEventService {
	return &SavedEventService{saved: saved, events: events}
}

func (s *SavedEventService) Save(ctx context.Context, userID, eventID string) error {
	uID, err := uuid.Parse(userID)
	if err != nil {
		return errors.New("invalid user id")
	}
	eID, err := uuid.Parse(eventID)
	if err != nil {
		return errors.New("invalid event id")
	}

	event, err := s.events.GetByID(ctx, eID)
	if err != nil {
		return err
	}

	if event.Status != models.EventStatusPublished && event.Status != models.EventStatusRegistrationClosed {
		return errors.New("only published events can be saved")
	}

	return s.saved.Save(ctx, uID, eID)
}

func (s *SavedEventService) Unsave(ctx context.Context, userID, eventID string) error {
	uID, err := uuid.Parse(userID)
	if err != nil {
		return errors.New("invalid user id")
	}
	eID, err := uuid.Parse(eventID)
	if err != nil {
		return errors.New("invalid event id")
	}

	return s.saved.Unsave(ctx, uID, eID)
}

func (s *SavedEventService) ListMine(ctx context.Context, userID string) ([]dto.EventResponse, error) {
	uID, err := uuid.Parse(userID)
	if err != nil {
		return nil, errors.New("invalid user id")
	}

	ids, err := s.saved.ListByUser(ctx, uID)
	if err != nil {
		return nil, err
	}

	result := make([]dto.EventResponse, 0, len(ids))
	for _, id := range ids {
		event, err := s.events.GetByID(ctx, id)
		if err != nil {
			// skip deleted/missing events
			continue
		}
		result = append(result, mapEventResponse(event))
	}
	return result, nil
}