package handler

import (
	"errors"
	"net/http"

	"nearevent-api/internal/repository"
	"nearevent-api/internal/service"
	"nearevent-api/internal/utils"

	"github.com/go-chi/chi/v5"
)

type AdminUserHandler struct {
	service *service.AdminUserService
}

func NewAdminUserHandler(service *service.AdminUserService) *AdminUserHandler {
	return &AdminUserHandler{service: service}
}

func (h *AdminUserHandler) List(w http.ResponseWriter, r *http.Request) {
	role := r.URL.Query().Get("role")
	status := r.URL.Query().Get("status")
	q := r.URL.Query().Get("q")

	res, err := h.service.List(r.Context(), role, status, q)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error(), nil)
		return
	}
	utils.Success(w, http.StatusOK, "Users", res)
}

func (h *AdminUserHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	res, err := h.service.GetByID(r.Context(), id)
	if err != nil {
		if errors.Is(err, repository.ErrUserNotFound) {
			utils.Error(w, http.StatusNotFound, "User not found", nil)
			return
		}
		utils.Error(w, http.StatusBadRequest, err.Error(), nil)
		return
	}
	utils.Success(w, http.StatusOK, "User details", res)
}

func (h *AdminUserHandler) Suspend(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	res, err := h.service.Suspend(r.Context(), id)
	if err != nil {
		if errors.Is(err, repository.ErrUserNotFound) {
			utils.Error(w, http.StatusNotFound, "User not found", nil)
			return
		}
		utils.Error(w, http.StatusBadRequest, err.Error(), nil)
		return
	}
	utils.Success(w, http.StatusOK, "User suspended", res)
}

func (h *AdminUserHandler) Activate(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	res, err := h.service.Activate(r.Context(), id)
	if err != nil {
		if errors.Is(err, repository.ErrUserNotFound) {
			utils.Error(w, http.StatusNotFound, "User not found", nil)
			return
		}
		utils.Error(w, http.StatusBadRequest, err.Error(), nil)
		return
	}
	utils.Success(w, http.StatusOK, "User activated", res)
}