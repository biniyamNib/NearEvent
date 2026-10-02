package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"nearevent-api/internal/auth"
	"nearevent-api/internal/dto"
	"nearevent-api/internal/middleware"
	"nearevent-api/internal/repository"
	"nearevent-api/internal/service"
	"nearevent-api/internal/utils"

	"github.com/go-chi/chi/v5"
)

type EventHandler struct {
	eventService *service.EventService
	tokens       *auth.TokenManager
}

func NewEventHandler(eventService *service.EventService, tokens *auth.TokenManager) *EventHandler {
	return &EventHandler{
		eventService: eventService,
		tokens:       tokens,
	}
}

func (h *EventHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	var req dto.CreateEventRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.Error(w, http.StatusBadRequest, "Invalid request body", nil)
		return
	}

	res, err := h.eventService.Create(r.Context(), userID, req)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error(), nil)
		return
	}

	utils.Success(w, http.StatusCreated, "Event submitted for review", res)
}

func (h *EventHandler) ListMine(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	res, err := h.eventService.ListMine(r.Context(), userID)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error(), nil)
		return
	}

	utils.Success(w, http.StatusOK, "Organizer events", res)
}

func (h *EventHandler) GetMine(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	eventID := chi.URLParam(r, "id")

	res, err := h.eventService.GetMine(r.Context(), userID, eventID)
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

	utils.Success(w, http.StatusOK, "Event details", res)
}

func (h *EventHandler) ListPending(w http.ResponseWriter, r *http.Request) {
	res, err := h.eventService.ListPending(r.Context())
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error(), nil)
		return
	}
	utils.Success(w, http.StatusOK, "Pending events", res)
}

func (h *EventHandler) Approve(w http.ResponseWriter, r *http.Request) {
	eventID := chi.URLParam(r, "id")

	res, err := h.eventService.Approve(r.Context(), eventID)
	if err != nil {
		if errors.Is(err, repository.ErrEventNotFound) {
			utils.Error(w, http.StatusNotFound, "Event not found", nil)
			return
		}
		utils.Error(w, http.StatusBadRequest, err.Error(), nil)
		return
	}

	utils.Success(w, http.StatusOK, "Event approved", res)
}

func (h *EventHandler) Reject(w http.ResponseWriter, r *http.Request) {
	eventID := chi.URLParam(r, "id")

	var req dto.ModerateEventRequest
	_ = json.NewDecoder(r.Body).Decode(&req)

	res, err := h.eventService.Reject(r.Context(), eventID, req.Reason)
	if err != nil {
		if errors.Is(err, repository.ErrEventNotFound) {
			utils.Error(w, http.StatusNotFound, "Event not found", nil)
			return
		}
		utils.Error(w, http.StatusBadRequest, err.Error(), nil)
		return
	}

	utils.Success(w, http.StatusOK, "Event rejected", res)
}

func (h *EventHandler) RequestChanges(w http.ResponseWriter, r *http.Request) {
	eventID := chi.URLParam(r, "id")

	var req dto.ModerateEventRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.Error(w, http.StatusBadRequest, "Invalid request body", nil)
		return
	}

	res, err := h.eventService.RequestChanges(r.Context(), eventID, req.Reason)
	if err != nil {
		if errors.Is(err, repository.ErrEventNotFound) {
			utils.Error(w, http.StatusNotFound, "Event not found", nil)
			return
		}
		utils.Error(w, http.StatusBadRequest, err.Error(), nil)
		return
	}

	utils.Success(w, http.StatusOK, "Changes requested", res)
}

func (h *EventHandler) ListPublished(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("q")
	categoryID := r.URL.Query().Get("category_id")
	dateFrom := r.URL.Query().Get("date_from")
	dateTo := r.URL.Query().Get("date_to")

	res, err := h.eventService.ListPublished(r.Context(), q, categoryID, dateFrom, dateTo)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error(), nil)
		return
	}
	utils.Success(w, http.StatusOK, "Published events", res)
}

func (h *EventHandler) GetPublished(w http.ResponseWriter, r *http.Request) {
	eventID := chi.URLParam(r, "id")

	userID := middleware.OptionalUserID(r, h.tokens)

	res, err := h.eventService.GetPublished(r.Context(), eventID, userID)
	if err != nil {
		if errors.Is(err, repository.ErrEventNotFound) {
			utils.Error(w, http.StatusNotFound, "Event not found", nil)
			return
		}
		utils.Error(w, http.StatusBadRequest, err.Error(), nil)
		return
	}

	utils.Success(w, http.StatusOK, "Event details", res)
}

func (h *EventHandler) UpdateMine(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	eventID := chi.URLParam(r, "id")

	var req dto.UpdateEventRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.Error(w, http.StatusBadRequest, "Invalid request body", nil)
		return
	}

	res, err := h.eventService.UpdateMine(r.Context(), userID, eventID, req)
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

	utils.Success(w, http.StatusOK, "Event updated successfully", res)
}

func (h *EventHandler) CancelMine(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	eventID := chi.URLParam(r, "id")

	res, err := h.eventService.CancelMine(r.Context(), userID, eventID)
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

	utils.Success(w, http.StatusOK, "Event cancelled", res)
}

func (h *EventHandler) CloseRegistrationMine(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	eventID := chi.URLParam(r, "id")

	res, err := h.eventService.CloseRegistrationMine(r.Context(), userID, eventID)
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

	utils.Success(w, http.StatusOK, "Registration closed", res)
}

func (h *EventHandler) ReopenRegistrationMine(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	eventID := chi.URLParam(r, "id")

	res, err := h.eventService.ReopenRegistrationMine(r.Context(), userID, eventID)
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

	utils.Success(w, http.StatusOK, "Registration reopened", res)
}

func (h *EventHandler) OrganizerDashboard(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	res, err := h.eventService.OrganizerDashboard(r.Context(), userID)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error(), nil)
		return
	}
	utils.Success(w, http.StatusOK, "Organizer dashboard", res)
}