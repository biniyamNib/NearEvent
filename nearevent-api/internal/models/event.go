package models

import (
	"time"

	"github.com/google/uuid"
)

type EventStatus string

const (
	EventStatusDraft              EventStatus = "draft"
	EventStatusPending            EventStatus = "pending"
	EventStatusPublished          EventStatus = "published"
	EventStatusRejected           EventStatus = "rejected"
	EventStatusCancelled          EventStatus = "cancelled"
	EventStatusRegistrationClosed EventStatus = "registration_closed"
)

type Event struct {
	ID              uuid.UUID   `json:"id"`
	OrganizerID     uuid.UUID   `json:"organizer_id"`
	CategoryID      *uuid.UUID  `json:"category_id,omitempty"`
	Title           string      `json:"title"`
	Description     string      `json:"description"`
	VenueName       string      `json:"venue_name"`
	Address         string      `json:"address"`
	EventDate       time.Time   `json:"event_date"`
	StartTime       string      `json:"start_time"`
	EndTime         string      `json:"end_time"`
	Capacity        int         `json:"capacity"`
	ImageURL        *string     `json:"image_url,omitempty"`
	Latitude        *float64    `json:"latitude,omitempty"`
	Longitude       *float64    `json:"longitude,omitempty"`
	Status          EventStatus `json:"status"`
	RejectionReason *string     `json:"rejection_reason,omitempty"`
	CreatedAt       time.Time   `json:"created_at"`
	UpdatedAt       time.Time   `json:"updated_at"`
}