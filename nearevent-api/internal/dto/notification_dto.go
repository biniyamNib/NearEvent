package dto

type NotificationResponse struct {
	ID        string  `json:"id"`
	Type      string  `json:"type"`
	Title     string  `json:"title"`
	Message   string  `json:"message"`
	EventID   *string `json:"event_id,omitempty"`
	IsRead    bool    `json:"is_read"`
	CreatedAt string  `json:"created_at"`
}