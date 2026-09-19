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

type AdminUserService struct {
	users *repository.UserRepository
}

func NewAdminUserService(users *repository.UserRepository) *AdminUserService {
	return &AdminUserService{users: users}
}

func (s *AdminUserService) List(ctx context.Context, role, status, q string) ([]dto.AdminUserResponse, error) {
	users, err := s.users.List(ctx, repository.UserListFilter{
		Role:   strings.ToLower(strings.TrimSpace(role)),
		Status: strings.ToLower(strings.TrimSpace(status)),
		Query:  strings.TrimSpace(q),
	})
	if err != nil {
		return nil, err
	}

	result := make([]dto.AdminUserResponse, 0, len(users))
	for _, u := range users {
		result = append(result, dto.AdminUserResponse{
			ID:        u.ID.String(),
			FullName:  u.FullName,
			Email:     u.Email,
			Role:      string(u.Role),
			Status:    string(u.Status),
			AvatarURL: u.AvatarURL,
			CreatedAt: u.CreatedAt.Format(time.RFC3339),
		})
	}
	return result, nil
}

func (s *AdminUserService) GetByID(ctx context.Context, id string) (*dto.AdminUserDetailResponse, error) {
	userID, err := uuid.Parse(id)
	if err != nil {
		return nil, errors.New("invalid user id")
	}

	user, err := s.users.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	resp := &dto.AdminUserDetailResponse{
		ID:        user.ID.String(),
		FullName:  user.FullName,
		Email:     user.Email,
		Role:      string(user.Role),
		Status:    string(user.Status),
		AvatarURL: user.AvatarURL,
		CreatedAt: user.CreatedAt.Format(time.RFC3339),
	}

	switch user.Role {
	case models.RoleAttendee:
		regCount, _ := s.users.CountRegistrationsByUser(ctx, user.ID)
		savedCount, _ := s.users.CountSavedByUser(ctx, user.ID)
		resp.RegisteredEvents = &regCount
		resp.SavedEvents = &savedCount
	case models.RoleOrganizer:
		eventCount, _ := s.users.CountEventsByOrganizer(ctx, user.ID)
		resp.EventsCreated = &eventCount
	}

	return resp, nil
}

func (s *AdminUserService) Suspend(ctx context.Context, id string) (*dto.AdminUserResponse, error) {
	return s.setStatus(ctx, id, models.UserStatusSuspended)
}

func (s *AdminUserService) Activate(ctx context.Context, id string) (*dto.AdminUserResponse, error) {
	return s.setStatus(ctx, id, models.UserStatusActive)
}

func (s *AdminUserService) setStatus(ctx context.Context, id string, status models.UserStatus) (*dto.AdminUserResponse, error) {
	userID, err := uuid.Parse(id)
	if err != nil {
		return nil, errors.New("invalid user id")
	}

	user, err := s.users.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	if user.Role == models.RoleAdmin {
		return nil, errors.New("admin users cannot be suspended/activated here")
	}

	if err := s.users.UpdateStatus(ctx, userID, status); err != nil {
		return nil, err
	}

	user.Status = status
	resp := dto.AdminUserResponse{
		ID:        user.ID.String(),
		FullName:  user.FullName,
		Email:     user.Email,
		Role:      string(user.Role),
		Status:    string(user.Status),
		AvatarURL: user.AvatarURL,
		CreatedAt: user.CreatedAt.Format(time.RFC3339),
	}
	return &resp, nil
}