package handler

import (
	"errors"
	"net/http"

	"nearevent-api/internal/middleware"
	"nearevent-api/internal/repository"
	"nearevent-api/internal/service"
	"nearevent-api/internal/utils"

	"github.com/go-chi/chi/v5"
)

type SavedEventHandler struct {
	service *service.SavedEventService
}

func NewSavedEventHandler(service *service.SavedEventService) *SavedEventHandler {
	return &SavedEventHandler{service: service}
}

func (h *SavedEventHandler) Save(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	eventID := chi.URLParam(r, "id")

	if err := h.service.Save(r.Context(), userID, eventID); err != nil {
		if errors.Is(err, repository.ErrEventNotFound) {
			utils.Error(w, http.StatusNotFound, "Event not found", nil)
			return
		}
		utils.Error(w, http.StatusBadRequest, err.Error(), nil)
		return
	}

	utils.Success(w, http.StatusOK, "Event saved", nil)
}

func (h *SavedEventHandler) Unsave(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	eventID := chi.URLParam(r, "id")

	if err := h.service.Unsave(r.Context(), userID, eventID); err != nil {
		if errors.Is(err, repository.ErrSavedEventNotFound) {
			utils.Error(w, http.StatusNotFound, "Saved event not found", nil)
			return
		}
		utils.Error(w, http.StatusBadRequest, err.Error(), nil)
		return
	}

	utils.Success(w, http.StatusOK, "Event unsaved", nil)
}

func (h *SavedEventHandler) ListMine(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	res, err := h.service.ListMine(r.Context(), userID)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error(), nil)
		return
	}

	utils.Success(w, http.StatusOK, "Saved events", res)
}