package service

import (
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
)

type UploadService struct {
	uploadDir string
}

func NewUploadService(uploadDir string) *UploadService {
	return &UploadService{uploadDir: uploadDir}
}

func (s *UploadService) SaveImage(fileHeader *multipart.FileHeader) (string, error) {
	if fileHeader == nil {
		return "", errors.New("file is required")
	}

	// Max 10MB
	if fileHeader.Size > 10*1024*1024 {
		return "", errors.New("image must be 10MB or less")
	}

	contentType := fileHeader.Header.Get("Content-Type")
	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))

	allowed := map[string]bool{
		".jpg":  true,
		".jpeg": true,
		".png":  true,
	}
	if !allowed[ext] {
		return "", errors.New("only PNG or JPG images are allowed")
	}

	// basic content-type check
	if contentType != "" &&
		contentType != "image/jpeg" &&
		contentType != "image/jpg" &&
		contentType != "image/png" {
		return "", errors.New("invalid image content type")
	}

	if err := os.MkdirAll(s.uploadDir, 0o755); err != nil {
		return "", fmt.Errorf("failed to create upload directory: %w", err)
	}

	filename := uuid.New().String() + ext
	dstPath := filepath.Join(s.uploadDir, filename)

	src, err := fileHeader.Open()
	if err != nil {
		return "", err
	}
	defer src.Close()

	dst, err := os.Create(dstPath)
	if err != nil {
		return "", err
	}
	defer dst.Close()

	if _, err := io.Copy(dst, src); err != nil {
		return "", err
	}

	// public path used by frontend
	return "/uploads/" + filename, nil
}