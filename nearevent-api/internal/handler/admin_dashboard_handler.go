package handler

import (
	"net/http"

	"nearevent-api/internal/service"
	"nearevent-api/internal/utils"
)

type AdminDashboardHandler struct {
	service *service.AdminDashboardService
}

func NewAdminDashboardHandler(service *service.AdminDashboardService) *AdminDashboardHandler {
	return &AdminDashboardHandler{service: service}
}

func (h *AdminDashboardHandler) Get(w http.ResponseWriter, r *http.Request) {
	res, err := h.service.Get(r.Context())
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error(), nil)
		return
	}
	utils.Success(w, http.StatusOK, "Admin dashboard", res)
}