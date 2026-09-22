package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"nearevent-api/internal/dto"
	"nearevent-api/internal/repository"
	"nearevent-api/internal/service"
	"nearevent-api/internal/utils"

	"github.com/go-chi/chi/v5"
)

type CategoryHandler struct {
	service *service.CategoryService
}

func NewCategoryHandler(service *service.CategoryService) *CategoryHandler {
	return &CategoryHandler{service: service}
}

func (h *CategoryHandler) ListActive(w http.ResponseWriter, r *http.Request) {
	res, err := h.service.ListActive(r.Context())
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error(), nil)
		return
	}
	utils.Success(w, http.StatusOK, "Active categories", res)
}

func (h *CategoryHandler) ListAll(w http.ResponseWriter, r *http.Request) {
	res, err := h.service.ListAll(r.Context())
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error(), nil)
		return
	}
	utils.Success(w, http.StatusOK, "All categories", res)
}

func (h *CategoryHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req dto.CreateCategoryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.Error(w, http.StatusBadRequest, "Invalid request body", nil)
		return
	}

	res, err := h.service.Create(r.Context(), req)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error(), nil)
		return
	}
	utils.Success(w, http.StatusCreated, "Category created", res)
}

func (h *CategoryHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var req dto.UpdateCategoryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.Error(w, http.StatusBadRequest, "Invalid request body", nil)
		return
	}

	res, err := h.service.Update(r.Context(), id, req)
	if err != nil {
		if errors.Is(err, repository.ErrCategoryNotFound) {
			utils.Error(w, http.StatusNotFound, "Category not found", nil)
			return
		}
		utils.Error(w, http.StatusBadRequest, err.Error(), nil)
		return
	}
	utils.Success(w, http.StatusOK, "Category updated", res)
}

func (h *CategoryHandler) SetStatus(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var req dto.CategoryStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.Error(w, http.StatusBadRequest, "Invalid request body", nil)
		return
	}

	res, err := h.service.SetStatus(r.Context(), id, req.Status)
	if err != nil {
		if errors.Is(err, repository.ErrCategoryNotFound) {
			utils.Error(w, http.StatusNotFound, "Category not found", nil)
			return
		}
		utils.Error(w, http.StatusBadRequest, err.Error(), nil)
		return
	}
	utils.Success(w, http.StatusOK, "Category status updated", res)
}

func (h *CategoryHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	if err := h.service.Delete(r.Context(), id); err != nil {
		if errors.Is(err, repository.ErrCategoryNotFound) {
			utils.Error(w, http.StatusNotFound, "Category not found", nil)
			return
		}
		utils.Error(w, http.StatusBadRequest, err.Error(), nil)
		return
	}

	utils.Success(w, http.StatusOK, "Category deleted", nil)
}