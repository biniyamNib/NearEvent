package repository

import (
	"context"
	"errors"
	"time"
	"fmt"
	"strings"

	"nearevent-api/internal/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrEventNotFound = errors.New("event not found")

type EventRepository struct {
	db *pgxpool.Pool
}

type EventListFilter struct {
	Query      string
	CategoryID string
	DateFrom   string 
	DateTo     string 
}

type OrganizerStats struct {
	TotalEvents        int
	PendingEvents      int
	PublishedEvents    int
	CancelledEvents    int
	TotalRegistrations int
}

type AdminEventStats struct {
	PendingEvents   int
	PublishedEvents int
	RejectedEvents  int
}

type PendingEventRow struct {
	Event          models.Event
	OrganizerName  string
	CategoryName   *string
}

type EventWithMeta struct {
	Event              models.Event
	OrganizerName      string
	OrganizerAvatarURL *string
	CategoryName       *string
}

func NewEventRepository(db *pgxpool.Pool) *EventRepository {
	return &EventRepository{db: db}
}

func (r *EventRepository) Create(ctx context.Context, event *models.Event) error {
	query := `
		INSERT INTO events (
			id, organizer_id, category_id, title, description, venue_name, address,
			event_date, start_time, end_time, capacity, image_url, latitude, longitude,
			status, rejection_reason, created_at, updated_at
		) VALUES (
			$1,$2,$3,$4,$5,$6,$7,
			$8,$9,$10,$11,$12,$13,$14,
			$15,$16,$17,$18
		)
	`

	_, err := r.db.Exec(
		ctx,
		query,
		event.ID,
		event.OrganizerID,
		event.CategoryID,
		event.Title,
		event.Description,
		event.VenueName,
		event.Address,
		event.EventDate,
		event.StartTime,
		event.EndTime,
		event.Capacity,
		event.ImageURL,
		event.Latitude,
		event.Longitude,
		event.Status,
		event.RejectionReason,
		event.CreatedAt,
		event.UpdatedAt,
	)
	return err
}

func (r *EventRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Event, error) {
	query := `
		SELECT id, organizer_id, category_id, title, description, venue_name, address,
		       event_date, start_time, end_time, capacity, image_url, latitude, longitude,
		       status, rejection_reason, created_at, updated_at
		FROM events
		WHERE id = $1
	`

	var event models.Event
	err := r.db.QueryRow(ctx, query, id).Scan(
		&event.ID,
		&event.OrganizerID,
		&event.CategoryID,
		&event.Title,
		&event.Description,
		&event.VenueName,
		&event.Address,
		&event.EventDate,
		&event.StartTime,
		&event.EndTime,
		&event.Capacity,
		&event.ImageURL,
		&event.Latitude,
		&event.Longitude,
		&event.Status,
		&event.RejectionReason,
		&event.CreatedAt,
		&event.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrEventNotFound
		}
		return nil, err
	}
	return &event, nil
}

func (r *EventRepository) ListByOrganizer(ctx context.Context, organizerID uuid.UUID) ([]models.Event, error) {
	query := `
		SELECT id, organizer_id, category_id, title, description, venue_name, address,
		       event_date, start_time, end_time, capacity, image_url, latitude, longitude,
		       status, rejection_reason, created_at, updated_at
		FROM events
		WHERE organizer_id = $1
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(ctx, query, organizerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	events := make([]models.Event, 0)
	for rows.Next() {
		var event models.Event
		if err := rows.Scan(
			&event.ID,
			&event.OrganizerID,
			&event.CategoryID,
			&event.Title,
			&event.Description,
			&event.VenueName,
			&event.Address,
			&event.EventDate,
			&event.StartTime,
			&event.EndTime,
			&event.Capacity,
			&event.ImageURL,
			&event.Latitude,
			&event.Longitude,
			&event.Status,
			&event.RejectionReason,
			&event.CreatedAt,
			&event.UpdatedAt,
		); err != nil {
			return nil, err
		}
		events = append(events, event)
	}

	return events, rows.Err()
}

func (r *EventRepository) Update(ctx context.Context, event *models.Event) error {
	query := `
		UPDATE events
		SET category_id = $1,
		    title = $2,
		    description = $3,
		    venue_name = $4,
		    address = $5,
		    event_date = $6,
		    start_time = $7,
		    end_time = $8,
		    capacity = $9,
		    image_url = $10,
		    latitude = $11,
		    longitude = $12,
		    status = $13,
		    rejection_reason = $14,
		    updated_at = $15
		WHERE id = $16
	`

	cmd, err := r.db.Exec(
		ctx,
		query,
		event.CategoryID,
		event.Title,
		event.Description,
		event.VenueName,
		event.Address,
		event.EventDate,
		event.StartTime,
		event.EndTime,
		event.Capacity,
		event.ImageURL,
		event.Latitude,
		event.Longitude,
		event.Status,
		event.RejectionReason,
		event.UpdatedAt,
		event.ID,
	)
	if err != nil {
		return err
	}
	if cmd.RowsAffected() == 0 {
		return ErrEventNotFound
	}
	return nil
}

func (r *EventRepository) ListPublished(ctx context.Context) ([]models.Event, error) {
	query := `
		SELECT id, organizer_id, category_id, title, description, venue_name, address,
		       event_date, start_time, end_time, capacity, image_url, latitude, longitude,
		       status, rejection_reason, created_at, updated_at
		FROM events
		WHERE status IN ('published', 'registration_closed')
		ORDER BY event_date ASC, start_time ASC
	`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	events := make([]models.Event, 0)
	for rows.Next() {
		var event models.Event
		if err := rows.Scan(
			&event.ID,
			&event.OrganizerID,
			&event.CategoryID,
			&event.Title,
			&event.Description,
			&event.VenueName,
			&event.Address,
			&event.EventDate,
			&event.StartTime,
			&event.EndTime,
			&event.Capacity,
			&event.ImageURL,
			&event.Latitude,
			&event.Longitude,
			&event.Status,
			&event.RejectionReason,
			&event.CreatedAt,
			&event.UpdatedAt,
		); err != nil {
			return nil, err
		}
		events = append(events, event)
	}
	return events, rows.Err()
}

func (r *EventRepository) ListPending(ctx context.Context) ([]PendingEventRow, error) {
	query := `
		SELECT
			e.id, e.organizer_id, e.category_id, e.title, e.description, e.venue_name, e.address,
			e.event_date, e.start_time, e.end_time, e.capacity, e.image_url, e.latitude, e.longitude,
			e.status, e.rejection_reason, e.created_at, e.updated_at,
			u.full_name AS organizer_name,
			c.name AS category_name
		FROM events e
		LEFT JOIN users u ON u.id = e.organizer_id
		LEFT JOIN categories c ON c.id = e.category_id
		WHERE e.status = 'pending'
		ORDER BY e.created_at ASC
	`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]PendingEventRow, 0)
	for rows.Next() {
		var row PendingEventRow
		if err := rows.Scan(
			&row.Event.ID,
			&row.Event.OrganizerID,
			&row.Event.CategoryID,
			&row.Event.Title,
			&row.Event.Description,
			&row.Event.VenueName,
			&row.Event.Address,
			&row.Event.EventDate,
			&row.Event.StartTime,
			&row.Event.EndTime,
			&row.Event.Capacity,
			&row.Event.ImageURL,
			&row.Event.Latitude,
			&row.Event.Longitude,
			&row.Event.Status,
			&row.Event.RejectionReason,
			&row.Event.CreatedAt,
			&row.Event.UpdatedAt,
			&row.OrganizerName,
			&row.CategoryName,
		); err != nil {
			return nil, err
		}
		items = append(items, row)
	}
	return items, rows.Err()
}

func (r *EventRepository) ListPublishedFiltered(
	ctx context.Context, 
	filter EventListFilter,
	) ([]models.Event, error) {
	query := `
		SELECT id, organizer_id, category_id, title, description, venue_name, address,
		       event_date, start_time, end_time, capacity, image_url, latitude, longitude,
		       status, rejection_reason, created_at, updated_at
		FROM events
		WHERE status IN ('published', 'registration_closed')
	`
	args := make([]interface{}, 0)
	argN := 1

	if strings.TrimSpace(filter.Query) != "" {
		query += fmt.Sprintf(" AND (title ILIKE $%d OR description ILIKE $%d OR venue_name ILIKE $%d OR address ILIKE $%d)", argN, argN, argN, argN)
		args = append(args, "%"+strings.TrimSpace(filter.Query)+"%")
		argN++
	}

	if strings.TrimSpace(filter.CategoryID) != "" {
		query += fmt.Sprintf(" AND category_id = $%d", argN)
		args = append(args, strings.TrimSpace(filter.CategoryID))
		argN++
	}

	if strings.TrimSpace(filter.DateFrom) != "" {
		query += fmt.Sprintf(" AND event_date >= $%d", argN)
		args = append(args, strings.TrimSpace(filter.DateFrom))
		argN++
	}

	if strings.TrimSpace(filter.DateTo) != "" {
		query += fmt.Sprintf(" AND event_date <= $%d", argN)
		args = append(args, strings.TrimSpace(filter.DateTo))
		argN++
	}

	query += " ORDER BY event_date ASC, start_time ASC"

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	events := make([]models.Event, 0)
	for rows.Next() {
		var event models.Event
		if err := rows.Scan(
			&event.ID,
			&event.OrganizerID,
			&event.CategoryID,
			&event.Title,
			&event.Description,
			&event.VenueName,
			&event.Address,
			&event.EventDate,
			&event.StartTime,
			&event.EndTime,
			&event.Capacity,
			&event.ImageURL,
			&event.Latitude,
			&event.Longitude,
			&event.Status,
			&event.RejectionReason,
			&event.CreatedAt,
			&event.UpdatedAt,
		); 
		
		err != nil {
			return nil, err
		}
		events = append(events, event)
	}
	return events, rows.Err()
}

func NewEvent(
	organizerID uuid.UUID,
	categoryID *uuid.UUID,
	title, description, venueName, address string,
	eventDate time.Time,
	startTime, endTime string,
	capacity int,
	imageURL *string,
	lat, lng *float64,
	status models.EventStatus,
) *models.Event {
	now := time.Now().UTC()
	return &models.Event{
		ID:          uuid.New(),
		OrganizerID: organizerID,
		CategoryID:  categoryID,
		Title:       title,
		Description: description,
		VenueName:   venueName,
		Address:     address,
		EventDate:   eventDate,
		StartTime:   startTime,
		EndTime:     endTime,
		Capacity:    capacity,
		ImageURL:    imageURL,
		Latitude:    lat,
		Longitude:   lng,
		Status:      status,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
}

func (r *EventRepository) GetOrganizerStats(ctx context.Context, organizerID uuid.UUID) (*OrganizerStats, error) {
	query := `
		SELECT
			COUNT(*) AS total_events,
			COUNT(*) FILTER (WHERE status = 'pending') AS pending_events,
			COUNT(*) FILTER (WHERE status IN ('published', 'registration_closed')) AS published_events,
			COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_events
		FROM events
		WHERE organizer_id = $1
	`

	var stats OrganizerStats
	err := r.db.QueryRow(ctx, query, organizerID).Scan(
		&stats.TotalEvents,
		&stats.PendingEvents,
		&stats.PublishedEvents,
		&stats.CancelledEvents,
	)
	if err != nil {
		return nil, err
	}

	regQuery := `
		SELECT COUNT(*)
		FROM event_registrations er
		INNER JOIN events e ON e.id = er.event_id
		WHERE e.organizer_id = $1 AND er.status = 'registered'
	`
	if err := r.db.QueryRow(ctx, regQuery, organizerID).Scan(&stats.TotalRegistrations); err != nil {
		return nil, err
	}

	return &stats, nil
}

func (r *EventRepository) GetAdminEventStats(ctx context.Context) (*AdminEventStats, error) {
	query := `
		SELECT
			COUNT(*) FILTER (WHERE status = 'pending') AS pending_events,
			COUNT(*) FILTER (WHERE status IN ('published', 'registration_closed')) AS published_events,
			COUNT(*) FILTER (WHERE status = 'rejected') AS rejected_events
		FROM events
	`
	var stats AdminEventStats
	err := r.db.QueryRow(ctx, query).Scan(
		&stats.PendingEvents,
		&stats.PublishedEvents,
		&stats.RejectedEvents,
	)
	if err != nil {
		return nil, err
	}
	return &stats, nil
}

func (r *EventRepository) GetPublishedByID(ctx context.Context, id uuid.UUID) (*EventWithMeta, error) {
	query := `
		SELECT
			e.id, e.organizer_id, e.category_id, e.title, e.description, e.venue_name, e.address,
			e.event_date, e.start_time, e.end_time, e.capacity, e.image_url, e.latitude, e.longitude,
			e.status, e.rejection_reason, e.created_at, e.updated_at,
			COALESCE(u.full_name, '') AS organizer_name,
			u.avatar_url AS organizer_avatar_url,
			c.name AS category_name
		FROM events e
		LEFT JOIN users u ON u.id = e.organizer_id
		LEFT JOIN categories c ON c.id = e.category_id
		WHERE e.id = $1
		  AND e.status IN ('published', 'registration_closed')
	`

	var row EventWithMeta
	err := r.db.QueryRow(ctx, query, id).Scan(
		&row.Event.ID,
		&row.Event.OrganizerID,
		&row.Event.CategoryID,
		&row.Event.Title,
		&row.Event.Description,
		&row.Event.VenueName,
		&row.Event.Address,
		&row.Event.EventDate,
		&row.Event.StartTime,
		&row.Event.EndTime,
		&row.Event.Capacity,
		&row.Event.ImageURL,
		&row.Event.Latitude,
		&row.Event.Longitude,
		&row.Event.Status,
		&row.Event.RejectionReason,
		&row.Event.CreatedAt,
		&row.Event.UpdatedAt,
		&row.OrganizerName,
		&row.OrganizerAvatarURL,
		&row.CategoryName,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrEventNotFound
		}
		return nil, err
	}
	return &row, nil
}
