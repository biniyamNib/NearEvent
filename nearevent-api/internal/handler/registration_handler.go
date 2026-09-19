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

type RegistrationHandler struct {
	service *service.RegistrationService
}

func NewRegistrationHandler(service *service.RegistrationService) *RegistrationHandler {
	return &RegistrationHandler{service: service}
}

func (h *RegistrationHandler) RSVP(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	eventID := chi.URLParam(r, "id")

	if err := h.service.RSVP(r.Context(), userID, eventID); err != nil {
		switch {
		case errors.Is(err, repository.ErrEventNotFound):
			utils.Error(w, http.StatusNotFound, "Event not found", nil)
		case errors.Is(err, repository.ErrAlreadyRegistered):
			utils.Error(w, http.StatusConflict, err.Error(), nil)
		case errors.Is(err, service.ErrEventFull):
			utils.Error(w, http.StatusConflict, err.Error(), nil)
		case errors.Is(err, service.ErrRegistrationClosed):
			utils.Error(w, http.StatusBadRequest, err.Error(), nil)
		default:
			utils.Error(w, http.StatusBadRequest, err.Error(), nil)
		}
		return
	}

	utils.Success(w, http.StatusOK, "RSVP successful", nil)
}

func (h *RegistrationHandler) Cancel(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	eventID := chi.URLParam(r, "id")

	if err := h.service.Cancel(r.Context(), userID, eventID); err != nil {
		if errors.Is(err, repository.ErrRegistrationNotFound) {
			utils.Error(w, http.StatusNotFound, "Registration not found", nil)
			return
		}
		utils.Error(w, http.StatusBadRequest, err.Error(), nil)
		return
	}

	utils.Success(w, http.StatusOK, "RSVP cancelled", nil)
}

func (h *RegistrationHandler) ListMine(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	res, err := h.service.ListMine(r.Context(), userID)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error(), nil)
		return
	}

	utils.Success(w, http.StatusOK, "My registrations", res)
}

func (h *RegistrationHandler) ListByEventForOrganizer(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	eventID := chi.URLParam(r, "id")

	res, err := h.service.ListByEventForOrganizer(r.Context(), userID, eventID)
	if err != nil {
		if errors.Is(err, repository.ErrEventNotFound) {
			utils.Error(w, http.StatusNotFound, "Event not found", nil)
			return
		}
		if errors.Is(err, service.ErrForbiddenEventAccess) {
			utils.Error(w, http.StatusForbidden, err.Error(), nil)
			return
		}
		utils.Error(w, http.StatusBadRequest, err.Error(), nil)
		return
	}

	utils.Success(w, http.StatusOK, "Event registrations", res)
}