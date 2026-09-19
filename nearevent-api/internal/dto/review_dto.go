package dto

type CreateReviewRequest struct {
	Rating  int     `json:"rating"`
	Comment *string `json:"comment,omitempty"`
}

type ReviewResponse struct {
	ID         string  `json:"id"`
	EventID    string  `json:"event_id"`
	UserID     string  `json:"user_id"`
	UserName   string  `json:"user_name"`
	Rating     int     `json:"rating"`
	Comment    *string `json:"comment,omitempty"`
	CreatedAt  string  `json:"created_at"`
}

type RatingSummaryResponse struct {
	Average float64 `json:"average"`
	Count   int     `json:"count"`
}