package service

import (
	"context"

	"nearevent-api/internal/dto"
	"nearevent-api/internal/repository"
)

type AdminDashboardService struct {
	events *repository.EventRepository
	users  *repository.UserRepository
}

func NewAdminDashboardService(
	events *repository.EventRepository,
	users *repository.UserRepository,
) *AdminDashboardService {
	return &AdminDashboardService{events: events, users: users}
}

func (s *AdminDashboardService) Get(ctx context.Context) (*dto.AdminDashboardResponse, error) {
	eventStats, err := s.events.GetAdminEventStats(ctx)
	if err != nil {
		return nil, err
	}
	userStats, err := s.users.GetAdminUserStats(ctx)
	if err != nil {
		return nil, err
	}

	return &dto.AdminDashboardResponse{
		PendingEvents:   eventStats.PendingEvents,
		PublishedEvents: eventStats.PublishedEvents,
		RejectedEvents:  eventStats.RejectedEvents,
		TotalUsers:      userStats.TotalUsers,
		TotalOrganizers: userStats.TotalOrganizers,
		TotalAttendees:  userStats.TotalAttendees,
	}, nil
}