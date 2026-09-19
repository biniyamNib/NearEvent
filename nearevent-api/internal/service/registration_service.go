package service

import (
	"context"
	"errors"
	"time"

	"nearevent-api/internal/dto"
	"nearevent-api/internal/models"
	"nearevent-api/internal/repository"

	"github.com/google/uuid"
)

var (
	ErrEventFull              = errors.New("event is full")
	ErrRegistrationClosed     = errors.New("registration is closed for this event")
	ErrEventNotAvailableToRSVP = errors.New("event is not available for registration")
)

type RegistrationService struct {
	regs   *repository.RegistrationRepository
	events *repository.EventRepository
	notifications *NotificationService
}

func NewRegistrationService(
	regs *repository.RegistrationRepository,
	events *repository.EventRepository,
	notifications *NotificationService,
) *RegistrationService {
	return &RegistrationService{
		regs: regs, 
		events: events,
		notifications: notifications,
	}
}

func (s *RegistrationService) RSVP(ctx context.Context, userID, eventID string) error {
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

	switch event.Status {
	case models.EventStatusPublished:
		// ok
	case models.EventStatusRegistrationClosed:
		return ErrRegistrationClosed
	default:
		return ErrEventNotAvailableToRSVP
	}

	// If already registered, return friendly error
	status, err := s.regs.Get(ctx, uID, eID)
	if err == nil && status == "registered" {
		return repository.ErrAlreadyRegistered
	}

	count, err := s.regs.CountActiveByEvent(ctx, eID)
	if err != nil {
		return err
	}
	if count >= event.Capacity {
		return ErrEventFull
	}

	if err := s.regs.Register(ctx, uID, eID); err != nil {
		return err
	}

	// Create notification (do not fail RSVP if notification fails)
	title := "RSVP confirmed"
	message := "You’re registered for " + event.Title
	_ = s.notifications.Create(ctx, uID, "rsvp_confirmed", title, message, &eID)

	return nil
}

func (s *RegistrationService) Cancel(ctx context.Context, userID, eventID string) error {
	uID, err := uuid.Parse(userID)
	if err != nil {
		return errors.New("invalid user id")
	}
	eID, err := uuid.Parse(eventID)
	if err != nil {
		return errors.New("invalid event id")
	}

	return s.regs.Cancel(ctx, uID, eID)
}

func (s *RegistrationService) ListMine(ctx context.Context, userID string) ([]dto.EventResponse, error) {
	uID, err := uuid.Parse(userID)
	if err != nil {
		return nil, errors.New("invalid user id")
	}

	ids, err := s.regs.ListEventIDsByUser(ctx, uID)
	if err != nil {
		return nil, err
	}

	result := make([]dto.EventResponse, 0, len(ids))
	for _, id := range ids {
		event, err := s.events.GetByID(ctx, id)
		if err != nil {
			continue
		}
		result = append(result, mapEventResponse(event))
	}
	return result, nil
}

func (s *RegistrationService) ListByEventForOrganizer(
	ctx context.Context,
	organizerID string,
	eventID string,
) ([]dto.RegistrantResponse, error) {
	orgID, err := uuid.Parse(organizerID)
	if err != nil {
		return nil, errors.New("invalid organizer id")
	}
	eID, err := uuid.Parse(eventID)
	if err != nil {
		return nil, errors.New("invalid event id")
	}

	event, err := s.events.GetByID(ctx, eID)
	if err != nil {
		return nil, err
	}
	if event.OrganizerID != orgID {
		return nil, ErrForbiddenEventAccess
	}

	items, err := s.regs.ListByEvent(ctx, eID)
	if err != nil {
		return nil, err
	}

	result := make([]dto.RegistrantResponse, 0, len(items))
	for _, item := range items {
		result = append(result, dto.RegistrantResponse{
			UserID:    item.UserID.String(),
			FullName:  item.FullName,
			Email:     item.Email,
			Status:    item.Status,
			CreatedAt: item.CreatedAt.Format(time.RFC3339),
		})
	}
	return result, nil
}