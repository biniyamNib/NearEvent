package dto

type CreateCategoryRequest struct {
	Name string `json:"name"`
}

type UpdateCategoryRequest struct {
	Name string `json:"name"`
}

type CategoryStatusRequest struct {
	Status string `json:"status"`
}

type CategoryResponse struct {
    ID        		   string `json:"id"`
	Name               string `json:"name"`
	Status             string `json:"status"`
	EventsCount        int    `json:"events_count"`
	CreatedAt          string `json:"created_at"`
	UpdatedAt          string `json:"updated_at"`
}