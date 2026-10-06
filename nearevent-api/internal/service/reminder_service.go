package service

import (
	"context"
	"log"
	"strings"
	"time"

	"nearevent-api/internal/email"
	"nearevent-api/internal/models"
	"nearevent-api/internal/repository"

	"github.com/google/uuid"
)

type ReminderService struct {
	events *repository.EventRepository
	regs   *repository.RegistrationRepository
	notifs *NotificationService
}

func NewReminderService(
	events *repository.EventRepository,
	regs *repository.RegistrationRepository,
	notifs *NotificationService,
) *ReminderService {
	return &ReminderService{
		events: events,
		regs:   regs,
		notifs: notifs,
	}
}

func (s *ReminderService) Run(ctx context.Context) error {
	events, err := s.events.ListForReminderScan(ctx)
	if err != nil {
		return err
	}

	now := time.Now()

	for _, e := range events {
		start, err := combineDateTime(e.EventDate, e.StartTime)
		if err != nil {
			continue
		}
		end, err := combineDateTime(e.EventDate, e.EndTime)
		if err != nil {
			end = start.Add(2 * time.Hour)
		}

		// ~24 hours before start
		if inWindow(now, start, 23*time.Hour, 25*time.Hour) {
			if err := s.send24h(ctx, e, start); err != nil {
				log.Println("reminder 24h:", e.ID, err)
			}
		}

		// ~1 hour before start
		if inWindow(now, start, 50*time.Minute, 70*time.Minute) {
			if err := s.send1h(ctx, e, start); err != nil {
				log.Println("reminder 1h:", e.ID, err)
			}
		}

		// after event ended (within 2 hours)
		if end.Before(now) && now.Sub(end) <= 2*time.Hour {
			if err := s.sendReview(ctx, e); err != nil {
				log.Println("review prompt:", e.ID, err)
			}
		}
	}

	return nil
}

func (s *ReminderService) send24h(ctx context.Context, e models.Event, start time.Time) error {
	people, err := s.regs.ListRegisteredForReminder(ctx, e.ID, "24h")
	if err != nil {
		return err
	}

	whenText := start.Format("Mon 2 Jan, 3:04 PM")
	venue := e.VenueName
	if strings.TrimSpace(venue) == "" {
		venue = e.Address
	}

	for _, p := range people {
		title := "Event reminder"
		msg := e.Title + " starts tomorrow at " + start.Format("3:04 PM")

		_ = s.notifs.Create(ctx, p.UserID, "event_reminder_24h", title, msg, &e.ID)
		_ = email.SendEventReminder24h(p.Email, e.Title, whenText, venue)
		_ = s.regs.MarkReminder24hSent(ctx, e.ID, p.UserID)
	}
	return nil
}

func (s *ReminderService) send1h(ctx context.Context, e models.Event, start time.Time) error {
	people, err := s.regs.ListRegisteredForReminder(ctx, e.ID, "1h")
	if err != nil {
		return err
	}

	whenText := start.Format("Mon 2 Jan, 3:04 PM")
	venue := e.VenueName
	if strings.TrimSpace(venue) == "" {
		venue = e.Address
	}

	for _, p := range people {
		title := "Starting soon"
		msg := e.Title + " starts in about an hour (" + start.Format("3:04 PM") + ")"

		_ = s.notifs.Create(ctx, p.UserID, "event_reminder_1h", title, msg, &e.ID)
		_ = email.SendEventReminder1h(p.Email, e.Title, whenText, venue)
		_ = s.regs.MarkReminder1hSent(ctx, e.ID, p.UserID)
	}
	return nil
}

func (s *ReminderService) sendReview(ctx context.Context, e models.Event) error {
	people, err := s.regs.ListRegisteredForReminder(ctx, e.ID, "review")
	if err != nil {
		return err
	}

	for _, p := range people {
		title := "How was the event?"
		msg := "Share a quick review of " + e.Title

		_ = s.notifs.Create(ctx, p.UserID, "review_prompt", title, msg, &e.ID)
		_ = email.SendReviewPrompt(p.Email, e.Title)
		_ = s.regs.MarkReviewPromptSent(ctx, e.ID, p.UserID)
	}
	return nil
}

func inWindow(now, start time.Time, minAhead, maxAhead time.Duration) bool {
	delta := start.Sub(now)
	return delta >= minAhead && delta <= maxAhead
}

func combineDateTime(date time.Time, hhmm string) (time.Time, error) {
	hhmm = strings.TrimSpace(hhmm)
	if len(hhmm) >= 5 {
		hhmm = hhmm[:5] // "15:04:00" → "15:04"
	}
	t, err := time.Parse("15:04", hhmm)
	if err != nil {
		return time.Time{}, err
	}
	return time.Date(
		date.Year(), date.Month(), date.Day(),
		t.Hour(), t.Minute(), 0, 0,
		time.Local,
	), nil
}

// silence unused import if uuid only needed by callers
var _ = uuid.Nil