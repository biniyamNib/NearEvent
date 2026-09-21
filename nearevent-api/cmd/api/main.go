package main

import (
	"context"
	"fmt"
	"log"
	"net/http"

	"nearevent-api/internal/auth"
	"nearevent-api/internal/config"
	"nearevent-api/internal/database"
	"nearevent-api/internal/handler"
	"nearevent-api/internal/repository"
	"nearevent-api/internal/server"
	"nearevent-api/internal/service"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	db, err := database.Connect(cfg.DatabaseURL())
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}
	defer db.Close()

	tokenManager := auth.NewTokenManager(cfg.JWTSecret, cfg.JWTExpiresInHours)

	// Repositories
	userRepo := repository.NewUserRepository(db)
	eventRepo := repository.NewEventRepository(db)
	savedRepo := repository.NewSavedEventRepository(db)
	regRepo := repository.NewRegistrationRepository(db)
	categoryRepo := repository.NewCategoryRepository(db)
	reviewRepo := repository.NewReviewRepository(db)
	notificationRepo := repository.NewNotificationRepository(db)

	// Seed admin
	adminHash, err := auth.HashPassword(cfg.AdminPassword)
	if err != nil {
		log.Fatalf("failed to hash admin password: %v", err)
	}
	if err := userRepo.EnsureAdmin(context.Background(), cfg.AdminName, cfg.AdminEmail, adminHash); err != nil {
		log.Fatalf("failed to seed admin user: %v", err)
	}
	log.Printf("admin user ready: %s", cfg.AdminEmail)

	// Services
	notificationService := service.NewNotificationService(notificationRepo)
	authService := service.NewAuthService(userRepo, tokenManager)
	eventService := service.NewEventService(eventRepo, regRepo, notificationService)
	savedService := service.NewSavedEventService(savedRepo, eventRepo)
	regService := service.NewRegistrationService(regRepo, eventRepo, notificationService)
	categoryService := service.NewCategoryService(categoryRepo)
	reviewService := service.NewReviewService(reviewRepo, eventRepo, regRepo)
	adminUserService := service.NewAdminUserService(userRepo)
	adminDashboardService := service.NewAdminDashboardService(eventRepo, userRepo)
	uploadService := service.NewUploadService("uploads")
	uploadHandler := handler.NewUploadHandler(uploadService)

	// Handlers
	authHandler := handler.NewAuthHandler(authService)
	eventHandler := handler.NewEventHandler(eventService)
	savedHandler := handler.NewSavedEventHandler(savedService)
	regHandler := handler.NewRegistrationHandler(regService)
	categoryHandler := handler.NewCategoryHandler(categoryService)
	reviewHandler := handler.NewReviewHandler(reviewService)
	notificationHandler := handler.NewNotificationHandler(notificationService)
	adminUserHandler := handler.NewAdminUserHandler(adminUserService)
	adminDashboardHandler := handler.NewAdminDashboardHandler(adminDashboardService)

	router := server.NewRouter(server.Dependencies{
		AuthHandler:         authHandler,
		EventHandler:        eventHandler,
		SavedEventHandler:   savedHandler,
		RegistrationHandler: regHandler,
		CategoryHandler:     categoryHandler,
		ReviewHandler:       reviewHandler,
		NotificationHandler: notificationHandler,
		AdminUserHandler:    adminUserHandler,
		AdminDashboardHandler: adminDashboardHandler,
		UploadHandler: uploadHandler,
		TokenManager:        tokenManager,
	})

	addr := fmt.Sprintf(":%s", cfg.AppPort)
	log.Printf("%s starting on %s (%s)", cfg.AppName, addr, cfg.AppEnv)

	if err := http.ListenAndServe(addr, router); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}