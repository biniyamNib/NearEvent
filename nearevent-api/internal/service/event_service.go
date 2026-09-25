package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"nearevent-api/internal/dto"
	"nearevent-api/internal/models"
	"nearevent-api/internal/repository"
	"nearevent-api/internal/utils"

	"github.com/google/uuid"
)

var (
	ErrForbiddenEventAccess = errors.New("you do not have access to this event")
	ErrInvalidEventData     = errors.New("invalid event data")
)

type EventService struct {
	events        *repository.EventRepository
	regs          *repository.RegistrationRepository
	notifications *NotificationService
}

func NewEventService(
	events *repository.EventRepository,
	regs *repository.RegistrationRepository,
	notifications *NotificationService,
) *EventService {
	return &EventService{
		events:        events,
		regs:          regs,
		notifications: notifications,
	}
}

func (s *EventService) Create(ctx context.Context, organizerID string, req dto.CreateEventRequest) (*dto.EventResponse, error) {
	orgID, err := uuid.Parse(organizerID)
	if err != nil {
		return nil, errors.New("invalid organizer id")
	}

	title := strings.TrimSpace(req.Title)
	description := strings.TrimSpace(req.Description)
	venueName := strings.TrimSpace(req.VenueName)
	address := strings.TrimSpace(req.Address)
	startTime := strings.TrimSpace(req.StartTime)
	endTime := strings.TrimSpace(req.EndTime)

	if err := utils.ValidateRequired(title, "title"); err != nil {
		return nil, err
	}
	if err := utils.ValidateRequired(description, "description"); err != nil {
		return nil, err
	}
	if err := utils.ValidateRequired(venueName, "venue_name"); err != nil {
		return nil, err
	}
	if err := utils.ValidateRequired(address, "address"); err != nil {
		return nil, err
	}
	if err := utils.ValidateRequired(req.EventDate, "event_date"); err != nil {
		return nil, err
	}
	if err := utils.ValidateRequired(startTime, "start_time"); err != nil {
		return nil, err
	}
	if err := utils.ValidateRequired(endTime, "end_time"); err != nil {
		return nil, err
	}
	if req.Capacity <= 0 {
		return nil, errors.New("capacity must be greater than 0")
	}

	eventDate, err := time.Parse("2006-01-02", req.EventDate)
	if err != nil {
		return nil, errors.New("event_date must be in YYYY-MM-DD format")
	}

	if startTime >= endTime {
		return nil, errors.New("end_time must be after start_time")
	}

	var categoryID *uuid.UUID
	if req.CategoryID != nil && strings.TrimSpace(*req.CategoryID) != "" {
		parsed, err := uuid.Parse(strings.TrimSpace(*req.CategoryID))
		if err != nil {
			return nil, errors.New("invalid category_id")
		}
		categoryID = &parsed
	}

	event := repository.NewEvent(
		orgID,
		categoryID,
		title,
		description,
		venueName,
		address,
		eventDate,
		startTime,
		endTime,
		req.Capacity,
		req.ImageURL,
		req.Latitude,
		req.Longitude,
		models.EventStatusPending, // submit for admin review on create
	)

	if err := s.events.Create(ctx, event); err != nil {
		return nil, err
	}

	resp := mapEventResponse(event)
	return &resp, nil
}

func (s *EventService) ListMine(ctx context.Context, organizerID string) ([]dto.EventResponse, error) {
	orgID, err := uuid.Parse(organizerID)
	if err != nil {
		return nil, errors.New("invalid organizer id")
	}

	events, err := s.events.ListByOrganizer(ctx, orgID)
	if err != nil {
		return nil, err
	}

	result := make([]dto.EventResponse, 0, len(events))
	for _, e := range events {
		result = append(result, mapEventResponse(&e))
	}
	return result, nil
}

func (s *EventService) GetMine(ctx context.Context, organizerID, eventID string) (*dto.EventResponse, error) {
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

	resp := mapEventResponse(event)
	return &resp, nil
}

func mapEventResponse(event *models.Event) dto.EventResponse {
	var categoryID *string
	if event.CategoryID != nil {
		value := event.CategoryID.String()
		categoryID = &value
	}

	return dto.EventResponse{
		ID:              event.ID.String(),
		OrganizerID:     event.OrganizerID.String(),
		CategoryID:      categoryID,
		Title:           event.Title,
		Description:     event.Description,
		VenueName:       event.VenueName,
		Address:         event.Address,
		EventDate:       event.EventDate.Format("2006-01-02"),
		StartTime:       event.StartTime,
		EndTime:         event.EndTime,
		Capacity:        event.Capacity,
		ImageURL:        event.ImageURL,
		Latitude:        event.Latitude,
		Longitude:       event.Longitude,
		Status:          string(event.Status),
		RejectionReason: event.RejectionReason,
		CreatedAt:       event.CreatedAt.Format(time.RFC3339),
		UpdatedAt:       event.UpdatedAt.Format(time.RFC3339),
	}
}

func mapEventResponseWithMeta(event *models.Event, organizerName string, categoryName *string) dto.EventResponse {
	resp := mapEventResponse(event)
	resp.OrganizerName = organizerName
	resp.CategoryName = categoryName
	return resp
}

func (s *EventService) ListPending(ctx context.Context) ([]dto.EventResponse, error) {
	rows, err := s.events.ListPending(ctx)
	if err != nil {
		return nil, err
	}

	result := make([]dto.EventResponse, 0, len(rows))
	for _, row := range rows {
		result = append(result, mapEventResponseWithMeta(&row.Event, row.OrganizerName, row.CategoryName))
	}
	return result, nil
}

func (s *EventService) Approve(ctx context.Context, eventID string) (*dto.EventResponse, error) {
	eID, err := uuid.Parse(eventID)
	if err != nil {
		return nil, errors.New("invalid event id")
	}

	event, err := s.events.GetByID(ctx, eID)
	if err != nil {
		return nil, err
	}

	if event.Status != models.EventStatusPending {
		return nil, errors.New("only pending events can be approved")
	}

	event.Status = models.EventStatusPublished
	event.RejectionReason = nil
	event.UpdatedAt = time.Now().UTC()

	if err := s.events.Update(ctx, event); err != nil {
		return nil, err
	}

	title := "Event approved"
	message := event.Title + " has been approved and is now public"
	_ = s.notifications.Create(ctx, event.OrganizerID, "event_approved", title, message, &event.ID)

	resp := mapEventResponse(event)
	return &resp, nil
}

func (s *EventService) Reject(ctx context.Context, eventID string, reason string) (*dto.EventResponse, error) {
	eID, err := uuid.Parse(eventID)
	if err != nil {
		return nil, errors.New("invalid event id")
	}

	event, err := s.events.GetByID(ctx, eID)
	if err != nil {
		return nil, err
	}

	if event.Status != models.EventStatusPending {
		return nil, errors.New("only pending events can be rejected")
	}

	reason = strings.TrimSpace(reason)
	event.Status = models.EventStatusRejected
	if reason != "" {
		event.RejectionReason = &reason
	}
	event.UpdatedAt = time.Now().UTC()

	if err := s.events.Update(ctx, event); err != nil {
		return nil, err
	}

	title := "Event rejected"
	message := event.Title + " has been rejected"
	if event.RejectionReason != nil && *event.RejectionReason != "" {
		message = message + ": " + *event.RejectionReason
	}
	_ = s.notifications.Create(ctx, event.OrganizerID, "event_rejected", title, message, &event.ID)

	resp := mapEventResponse(event)
	return &resp, nil
}

func (s *EventService) RequestChanges(ctx context.Context, eventID string, reason string) (*dto.EventResponse, error) {
	eID, err := uuid.Parse(eventID)
	if err != nil {
		return nil, errors.New("invalid event id")
	}

	event, err := s.events.GetByID(ctx, eID)
	if err != nil {
		return nil, err
	}

	if event.Status != models.EventStatusPending {
		return nil, errors.New("only pending events can receive change requests")
	}

	reason = strings.TrimSpace(reason)
	if reason == "" {
		return nil, errors.New("reason is required when requesting changes")
	}

	// Keep it non-public; use rejected with reason for MVP simplicity,
	// or stay pending with reason. We'll keep pending and store reason.
	event.RejectionReason = &reason
	event.UpdatedAt = time.Now().UTC()

	if err := s.events.Update(ctx, event); err != nil {
		return nil, err
	}

	title := "Changes requested"
	message := "Please update " + event.Title + " before it can be approved: " + reason
	_ = s.notifications.Create(ctx, event.OrganizerID, "event_changes_requested", title, message, &event.ID)

	resp := mapEventResponse(event)
	return &resp, nil
}

func (s *EventService) ListPublished(ctx context.Context, q, categoryID, dateFrom, dateTo string) ([]dto.EventResponse, error) {
	events, err := s.events.ListPublishedFiltered(
		ctx, repository.EventListFilter{
		Query:      q,
		CategoryID: categoryID,
		DateFrom:   dateFrom,
		DateTo:     dateTo,
	})
	if err != nil {
		return nil, err
	}

	result := make([]dto.EventResponse, 0, len(events))
	for _, e := range events {
		result = append(result, mapEventResponse(&e))
	}
	return result, nil
}

func (s *EventService) GetPublished(ctx context.Context, eventID string) (*dto.EventResponse, error) {
	eID, err := uuid.Parse(eventID)
	if err != nil {
		return nil, errors.New("invalid event id")
	}

	row, err := s.events.GetPublishedByID(ctx, eID)
	if err != nil {
		return nil, err
	}

	resp := mapEventResponseWithMeta(&row.Event, row.OrganizerName, row.CategoryName)
	resp.OrganizerAvatarURL = row.OrganizerAvatarURL
	return &resp, nil
}

func (s *EventService) UpdateMine(ctx context.Context, organizerID, eventID string, req dto.UpdateEventRequest) (*dto.EventResponse, error) {
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

	// Do not allow editing cancelled events
	if event.Status == models.EventStatusCancelled {
		return nil, errors.New("cancelled events cannot be edited")
	}

	title := strings.TrimSpace(req.Title)
	description := strings.TrimSpace(req.Description)
	venueName := strings.TrimSpace(req.VenueName)
	address := strings.TrimSpace(req.Address)
	startTime := strings.TrimSpace(req.StartTime)
	endTime := strings.TrimSpace(req.EndTime)

	if err := utils.ValidateRequired(title, "title"); err != nil {
		return nil, err
	}
	if err := utils.ValidateRequired(description, "description"); err != nil {
		return nil, err
	}
	if err := utils.ValidateRequired(venueName, "venue_name"); err != nil {
		return nil, err
	}
	if err := utils.ValidateRequired(address, "address"); err != nil {
		return nil, err
	}
	if err := utils.ValidateRequired(req.EventDate, "event_date"); err != nil {
		return nil, err
	}
	if err := utils.ValidateRequired(startTime, "start_time"); err != nil {
		return nil, err
	}
	if err := utils.ValidateRequired(endTime, "end_time"); err != nil {
		return nil, err
	}
	if req.Capacity <= 0 {
		return nil, errors.New("capacity must be greater than 0")
	}
	if startTime >= endTime {
		return nil, errors.New("end_time must be after start_time")
	}

	eventDate, err := time.Parse("2006-01-02", req.EventDate)
	if err != nil {
		return nil, errors.New("event_date must be in YYYY-MM-DD format")
	}

	var categoryID *uuid.UUID
	if req.CategoryID != nil && strings.TrimSpace(*req.CategoryID) != "" {
		parsed, err := uuid.Parse(strings.TrimSpace(*req.CategoryID))
		if err != nil {
			return nil, errors.New("invalid category_id")
		}
		categoryID = &parsed
	}

	event.CategoryID = categoryID
	event.Title = title
	event.Description = description
	event.VenueName = venueName
	event.Address = address
	event.EventDate = eventDate
	event.StartTime = startTime
	event.EndTime = endTime
	event.Capacity = req.Capacity
	event.ImageURL = req.ImageURL
	event.Latitude = req.Latitude
	event.Longitude = req.Longitude
	event.UpdatedAt = time.Now().UTC()

	// published event stays published after edit
	// pending/rejected stay as-is unless you later add resubmit flow

	if err := s.events.Update(ctx, event); err != nil {
		return nil, err
	}

	resp := mapEventResponse(event)
	return &resp, nil
}

func (s *EventService) CancelMine(ctx context.Context, organizerID, eventID string) (*dto.EventResponse, error) {
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
	if event.Status == models.EventStatusCancelled {
		return nil, errors.New("event is already cancelled")
	}

	event.Status = models.EventStatusCancelled
	event.UpdatedAt = time.Now().UTC()

	if err := s.events.Update(ctx, event); err != nil {
		return nil, err
	}

	userIDs, err := s.regs.ListUserIDsByEvent(ctx, event.ID)
	if err == nil {
		for _, userID := range userIDs {
			title := "Event cancelled"
			message := event.Title + " has been cancelled"
			_ = s.notifications.Create(ctx, userID, "event_cancelled", title, message, &event.ID)
		}
	}

	resp := mapEventResponse(event)
	return &resp, nil
}

func (s *EventService) CloseRegistrationMine(ctx context.Context, organizerID, eventID string) (*dto.EventResponse, error) {
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

	if event.Status != models.EventStatusPublished {
		return nil, errors.New("only published events can close registration")
	}

	event.Status = models.EventStatusRegistrationClosed
	event.UpdatedAt = time.Now().UTC()

	if err := s.events.Update(ctx, event); err != nil {
		return nil, err
	}

	resp := mapEventResponse(event)
	return &resp, nil
}

func (s *EventService) ReopenRegistrationMine(ctx context.Context, organizerID, eventID string) (*dto.EventResponse, error) {
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

	if event.Status != models.EventStatusRegistrationClosed {
		return nil, errors.New("only registration_closed events can reopen registration")
	}

	event.Status = models.EventStatusPublished
	event.UpdatedAt = time.Now().UTC()

	if err := s.events.Update(ctx, event); err != nil {
		return nil, err
	}

	resp := mapEventResponse(event)
	return &resp, nil
}

func (s *EventService) OrganizerDashboard(ctx context.Context, organizerID string) (*dto.OrganizerDashboardResponse, error) {
	orgID, err := uuid.Parse(organizerID)
	if err != nil {
		return nil, errors.New("invalid organizer id")
	}

	stats, err := s.events.GetOrganizerStats(ctx, orgID)
	if err != nil {
		return nil, err
	}

	return &dto.OrganizerDashboardResponse{
		TotalEvents:        stats.TotalEvents,
		PendingEvents:      stats.PendingEvents,
		PublishedEvents:    stats.PublishedEvents,
		CancelledEvents:    stats.CancelledEvents,
		TotalRegistrations: stats.TotalRegistrations,
	}, nil
}
