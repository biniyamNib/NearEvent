package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"nearevent-api/internal/dto"
	"nearevent-api/internal/middleware"
	"nearevent-api/internal/repository"
	"nearevent-api/internal/service"
	"nearevent-api/internal/utils"

	"github.com/go-chi/chi/v5"
)

type ReviewHandler struct {
	service *service.ReviewService
}

func NewReviewHandler(service *service.ReviewService) *ReviewHandler {
	return &ReviewHandler{service: service}
}

func (h *ReviewHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	eventID := chi.URLParam(r, "id")

	var req dto.CreateReviewRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.Error(w, http.StatusBadRequest, "Invalid request body", nil)
		return
	}

	res, err := h.service.Create(r.Context(), userID, eventID, req)
	if err != nil {
		switch {
		case errors.Is(err, repository.ErrEventNotFound):
			utils.Error(w, http.StatusNotFound, "Event not found", nil)
		case errors.Is(err, repository.ErrReviewAlreadyExists):
			utils.Error(w, http.StatusConflict, err.Error(), nil)
		default:
			utils.Error(w, http.StatusBadRequest, err.Error(), nil)
		}
		return
	}

	utils.Success(w, http.StatusCreated, "Review submitted", res)
}

func (h *ReviewHandler) ListByEvent(w http.ResponseWriter, r *http.Request) {
	eventID := chi.URLParam(r, "id")

	res, err := h.service.ListByEvent(r.Context(), eventID)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error(), nil)
		return
	}

	utils.Success(w, http.StatusOK, "Event reviews", res)
}

func (h *ReviewHandler) Summary(w http.ResponseWriter, r *http.Request) {
	eventID := chi.URLParam(r, "id")

	res, err := h.service.Summary(r.Context(), eventID)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error(), nil)
		return
	}

	utils.Success(w, http.StatusOK, "Rating summary", res)
}