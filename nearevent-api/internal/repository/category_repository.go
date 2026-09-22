package repository

import (
	"context"
	"errors"
	"time"

	"nearevent-api/internal/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrCategoryNotFound = errors.New("category not found")

type CategoryRepository struct {
	db *pgxpool.Pool
}

func NewCategoryRepository(db *pgxpool.Pool) *CategoryRepository {
	return &CategoryRepository{db: db}
}

func (r *CategoryRepository) Create(ctx context.Context, category *models.Category) error {
	query := `
		INSERT INTO categories (id, name, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5)
	`
	_, err := r.db.Exec(ctx, query, category.ID, category.Name, category.Status, category.CreatedAt, category.UpdatedAt)
	return err
}

func (r *CategoryRepository) Update(ctx context.Context, category *models.Category) error {
	query := `
		UPDATE categories
		SET name = $1, status = $2, updated_at = $3
		WHERE id = $4
	`
	cmd, err := r.db.Exec(ctx, query, category.Name, category.Status, category.UpdatedAt, category.ID)
	if err != nil {
		return err
	}
	if cmd.RowsAffected() == 0 {
		return ErrCategoryNotFound
	}
	return nil
}

func (r *CategoryRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Category, error) {
	query := `
		SELECT id, name, status, created_at, updated_at
		FROM categories
		WHERE id = $1
	`
	var c models.Category
	err := r.db.QueryRow(ctx, query, id).Scan(&c.ID, &c.Name, &c.Status, &c.CreatedAt, &c.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrCategoryNotFound
		}
		return nil, err
	}
	return &c, nil
}

func (r *CategoryRepository) ListAll(ctx context.Context) ([]models.Category, error) {
	query := `
		SELECT id, name, status, created_at, updated_at
		FROM categories
		ORDER BY name ASC
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]models.Category, 0)
	for rows.Next() {
		var c models.Category
		if err := rows.Scan(&c.ID, &c.Name, &c.Status, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, err
		}
		items = append(items, c)
	}
	return items, rows.Err()
}

func (r *CategoryRepository) ListActive(ctx context.Context) ([]models.Category, error) {
	query := `
		SELECT id, name, status, created_at, updated_at
		FROM categories
		WHERE status = 'active'
		ORDER BY name ASC
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]models.Category, 0)
	for rows.Next() {
		var c models.Category
		if err := rows.Scan(&c.ID, &c.Name, &c.Status, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, err
		}
		items = append(items, c)
	}
	return items, rows.Err()
}

func NewCategory(name string) *models.Category {
	now := time.Now().UTC()
	return &models.Category{
		ID:        uuid.New(),
		Name:      name,
		Status:    models.CategoryStatusActive,
		CreatedAt: now,
		UpdatedAt: now,
	}
}

func (r *CategoryRepository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, `UPDATE events SET category_id = NULL WHERE category_id = $1`, id)
	if err != nil {
		return err
	}

	cmd, err := r.db.Exec(ctx, `DELETE FROM categories WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if cmd.RowsAffected() == 0 {
		return ErrCategoryNotFound
	}
	return nil
}