package dto

type CreateEventRequest struct {
	Title       string   `json:"title"`
	Description string   `json:"description"`
	CategoryID  *string  `json:"category_id,omitempty"`
	VenueName   string   `json:"venue_name"`
	Address     string   `json:"address"`
	EventDate   string   `json:"event_date"` // YYYY-MM-DD
	StartTime   string   `json:"start_time"` // HH:MM
	EndTime     string   `json:"end_time"`   // HH:MM
	Capacity    int      `json:"capacity"`
	ImageURL    *string  `json:"image_url,omitempty"`
	Latitude    *float64 `json:"latitude,omitempty"`
	Longitude   *float64 `json:"longitude,omitempty"`
}

type UpdateEventRequest struct {
	Title       string   `json:"title"`
	Description string   `json:"description"`
	CategoryID  *string  `json:"category_id,omitempty"`
	VenueName   string   `json:"venue_name"`
	Address     string   `json:"address"`
	EventDate   string   `json:"event_date"`
	StartTime   string   `json:"start_time"`
	EndTime     string   `json:"end_time"`
	Capacity    int      `json:"capacity"`
	ImageURL    *string  `json:"image_url,omitempty"`
	Latitude    *float64 `json:"latitude,omitempty"`
	Longitude   *float64 `json:"longitude,omitempty"`
}

type EventResponse struct {
	ID              string   `json:"id"`
	OrganizerID     string   `json:"organizer_id"`
	CategoryID      *string  `json:"category_id,omitempty"`
	Title           string   `json:"title"`
	Description     string   `json:"description"`
	VenueName       string   `json:"venue_name"`
	Address         string   `json:"address"`
	EventDate       string   `json:"event_date"`
	StartTime       string   `json:"start_time"`
	EndTime         string   `json:"end_time"`
	Capacity        int      `json:"capacity"`
	ImageURL        *string  `json:"image_url,omitempty"`
	Latitude        *float64 `json:"latitude,omitempty"`
	Longitude       *float64 `json:"longitude,omitempty"`
	Status          string   `json:"status"`
	RejectionReason *string  `json:"rejection_reason,omitempty"`
	CreatedAt       string   `json:"created_at"`
	UpdatedAt       string   `json:"updated_at"`
}

type RegistrantResponse struct {
	UserID    string `json:"user_id"`
	FullName  string `json:"full_name"`
	Email     string `json:"email"`
	Status    string `json:"status"`
	CreatedAt string `json:"created_at"`
}

type OrganizerDashboardResponse struct {
	TotalEvents        int `json:"total_events"`
	PendingEvents      int `json:"pending_events"`
	PublishedEvents    int `json:"published_events"`
	CancelledEvents    int `json:"cancelled_events"`
	TotalRegistrations int `json:"total_registrations"`
}

type AdminDashboardResponse struct {
	PendingEvents   int `json:"pending_events"`
	PublishedEvents int `json:"published_events"`
	RejectedEvents  int `json:"rejected_events"`
	TotalUsers      int `json:"total_users"`
	TotalOrganizers int `json:"total_organizers"`
	TotalAttendees  int `json:"total_attendees"`
}

type ModerateEventRequest struct {
	Reason string `json:"reason,omitempty"`
}
