package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"nearevent-api/internal/dto"
	"nearevent-api/internal/models"
	"nearevent-api/internal/repository"
	"nearevent-api/internal/utils"

	"github.com/google/uuid"
)

type CategoryService struct {
	categories *repository.CategoryRepository
}

func NewCategoryService(categories *repository.CategoryRepository) *CategoryService {
	return &CategoryService{categories: categories}
}

func (s *CategoryService) Create(ctx context.Context, req dto.CreateCategoryRequest) (*dto.CategoryResponse, error) {
	name := strings.TrimSpace(req.Name)
	if err := utils.ValidateRequired(name, "name"); err != nil {
		return nil, err
	}

	category := repository.NewCategory(name)
	if err := s.categories.Create(ctx, category); err != nil {
		return nil, err
	}

	resp := mapCategoryResponse(category)
	return &resp, nil
}

func (s *CategoryService) Update(ctx context.Context, id string, req dto.UpdateCategoryRequest) (*dto.CategoryResponse, error) {
	categoryID, err := uuid.Parse(id)
	if err != nil {
		return nil, errors.New("invalid category id")
	}

	category, err := s.categories.GetByID(ctx, categoryID)
	if err != nil {
		return nil, err
	}

	name := strings.TrimSpace(req.Name)
	if err := utils.ValidateRequired(name, "name"); err != nil {
		return nil, err
	}

	category.Name = name
	category.UpdatedAt = time.Now().UTC()

	if err := s.categories.Update(ctx, category); err != nil {
		return nil, err
	}

	resp := mapCategoryResponse(category)
	return &resp, nil
}

func (s *CategoryService) SetStatus(ctx context.Context, id string, status string) (*dto.CategoryResponse, error) {
	categoryID, err := uuid.Parse(id)
	if err != nil {
		return nil, errors.New("invalid category id")
	}

	category, err := s.categories.GetByID(ctx, categoryID)
	if err != nil {
		return nil, err
	}

	status = strings.ToLower(strings.TrimSpace(status))
	switch status {
	case "active":
		category.Status = models.CategoryStatusActive
	case "inactive":
		category.Status = models.CategoryStatusInactive
	default:
		return nil, errors.New("status must be active or inactive")
	}

	category.UpdatedAt = time.Now().UTC()
	if err := s.categories.Update(ctx, category); err != nil {
		return nil, err
	}

	resp := mapCategoryResponse(category)
	return &resp, nil
}

func (s *CategoryService) ListAll(ctx context.Context) ([]dto.CategoryResponse, error) {
	items, err := s.categories.ListAll(ctx)
	if err != nil {
		return nil, err
	}
	return mapCategories(items), nil
}

func (s *CategoryService) ListActive(ctx context.Context) ([]dto.CategoryResponse, error) {
	items, err := s.categories.ListActive(ctx)
	if err != nil {
		return nil, err
	}
	return mapCategories(items), nil
}

func mapCategories(items []models.Category) []dto.CategoryResponse {
	result := make([]dto.CategoryResponse, 0, len(items))
	for _, item := range items {
		result = append(result, mapCategoryResponse(&item))
	}
	return result
}

func mapCategoryResponse(c *models.Category) dto.CategoryResponse {
	return dto.CategoryResponse{
		ID:        c.ID.String(),
		Name:      c.Name,
		Status:    string(c.Status),
		CreatedAt: c.CreatedAt.Format(time.RFC3339),
		UpdatedAt: c.UpdatedAt.Format(time.RFC3339),
	}
}