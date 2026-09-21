package handler

import (
	"net/http"

	"nearevent-api/internal/service"
	"nearevent-api/internal/utils"
)

type UploadHandler struct {
	uploadService *service.UploadService
}

func NewUploadHandler(uploadService *service.UploadService) *UploadHandler {
	return &UploadHandler{uploadService: uploadService}
}

func (h *UploadHandler) UploadImage(w http.ResponseWriter, r *http.Request) {
	// 12MB parse limit
	if err := r.ParseMultipartForm(12 << 20); err != nil {
		utils.Error(w, http.StatusBadRequest, "Invalid multipart form", nil)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		utils.Error(w, http.StatusBadRequest, "file is required", nil)
		return
	}
	defer file.Close()

	url, err := h.uploadService.SaveImage(header)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error(), nil)
		return
	}

	utils.Success(w, http.StatusOK, "Image uploaded", map[string]string{
		"url": url,
	})
}