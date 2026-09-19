package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"nearevent-api/internal/dto"
	"nearevent-api/internal/models"
	"nearevent-api/internal/repository"

	"github.com/google/uuid"
)

var (
	ErrInvalidRating = errors.New("rating must be between 1 and 5")
)

type ReviewService struct {
	reviews *repository.ReviewRepository
	events  *repository.EventRepository
	regs    *repository.RegistrationRepository
}

func NewReviewService(
	reviews *repository.ReviewRepository,
	events *repository.EventRepository,
	regs *repository.RegistrationRepository,
) *ReviewService {
	return &ReviewService{
		reviews: reviews,
		events:  events,
		regs:    regs,
	}
}

func (s *ReviewService) Create(ctx context.Context, userID, eventID string, req dto.CreateReviewRequest) (*dto.ReviewResponse, error) {
	uID, err := uuid.Parse(userID)
	if err != nil {
		return nil, errors.New("invalid user id")
	}
	eID, err := uuid.Parse(eventID)
	if err != nil {
		return nil, errors.New("invalid event id")
	}

	if req.Rating < 1 || req.Rating > 5 {
		return nil, ErrInvalidRating
	}

	event, err := s.events.GetByID(ctx, eID)
	if err != nil {
		return nil, err
	}

	// Only allow reviews on published / registration_closed / maybe past events
	if event.Status != models.EventStatusPublished &&
		event.Status != models.EventStatusRegistrationClosed &&
		event.Status != models.EventStatusCancelled {
		return nil, errors.New("reviews are not available for this event")
	}

	// Optional MVP rule: must be registered to review
	status, err := s.regs.Get(ctx, uID, eID)
	if err != nil || status != "registered" {
		// if never registered or cancelled
		if err != nil || status != "registered" {
			return nil, errors.New("only registered attendees can review this event")
		}
	}

	exists, err := s.reviews.Exists(ctx, uID, eID)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, repository.ErrReviewAlreadyExists
	}

	var comment *string
	if req.Comment != nil {
		trimmed := strings.TrimSpace(*req.Comment)
		if trimmed != "" {
			comment = &trimmed
		}
	}

	review := repository.NewReview(eID, uID, req.Rating, comment)
	if err := s.reviews.Create(ctx, review); err != nil {
		return nil, err
	}

	// For response, user name can be filled later by list endpoint.
	resp := dto.ReviewResponse{
		ID:        review.ID.String(),
		EventID:   review.EventID.String(),
		UserID:    review.UserID.String(),
		UserName:  "",
		Rating:    review.Rating,
		Comment:   review.Comment,
		CreatedAt: review.CreatedAt.Format(time.RFC3339),
	}
	return &resp, nil
}

func (s *ReviewService) ListByEvent(ctx context.Context, eventID string) ([]dto.ReviewResponse, error) {
	eID, err := uuid.Parse(eventID)
	if err != nil {
		return nil, errors.New("invalid event id")
	}

	items, err := s.reviews.ListByEvent(ctx, eID)
	if err != nil {
		return nil, err
	}

	result := make([]dto.ReviewResponse, 0, len(items))
	for _, item := range items {
		result = append(result, dto.ReviewResponse{
			ID:        item.ID.String(),
			EventID:   item.EventID.String(),
			UserID:    item.UserID.String(),
			UserName:  item.UserName,
			Rating:    item.Rating,
			Comment:   item.Comment,
			CreatedAt: item.CreatedAt.Format(time.RFC3339),
		})
	}
	return result, nil
}

func (s *ReviewService) Summary(ctx context.Context, eventID string) (*dto.RatingSummaryResponse, error) {
	eID, err := uuid.Parse(eventID)
	if err != nil {
		return nil, errors.New("invalid event id")
	}

	avg, count, err := s.reviews.SummaryByEvent(ctx, eID)
	if err != nil {
		return nil, err
	}

	return &dto.RatingSummaryResponse{
		Average: avg,
		Count:   count,
	}, nil
}