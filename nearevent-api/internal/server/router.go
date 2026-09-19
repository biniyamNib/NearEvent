package server

import (
	"net/http"

	"nearevent-api/internal/auth"
	"nearevent-api/internal/handler"
	"nearevent-api/internal/middleware"
	"nearevent-api/internal/utils"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

type Dependencies struct {
	AuthHandler  *handler.AuthHandler
	EventHandler *handler.EventHandler
	SavedEventHandler *handler.SavedEventHandler
	RegistrationHandler *handler.RegistrationHandler
	CategoryHandler *handler.CategoryHandler
	ReviewHandler *handler.ReviewHandler
	NotificationHandler *handler.NotificationHandler
	AdminUserHandler *handler.AdminUserHandler
	AdminDashboardHandler *handler.AdminDashboardHandler
	TokenManager *auth.TokenManager
}

func NewRouter(deps Dependencies) http.Handler {
	r := chi.NewRouter()

	r.Use(chimw.RequestID)
	r.Use(chimw.RealIP)
	r.Use(chimw.Logger)
	r.Use(chimw.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		utils.Success(w, http.StatusOK, "NearEvent API is running", map[string]string{
			"status": "ok",
		})
	})

	r.Route("/api/v1", func(api chi.Router) {
		api.Route("/auth", func(authRoute chi.Router) {
			authRoute.Post("/register", deps.AuthHandler.Register)
			authRoute.Post("/login", deps.AuthHandler.Login)
			authRoute.Post("/forgot-password", deps.AuthHandler.ForgotPassword)
			authRoute.Post("/reset-password", deps.AuthHandler.ResetPassword)
			authRoute.Group(func(private chi.Router) {
				private.Use(middleware.AuthRequired(deps.TokenManager))
				private.Get("/me", deps.AuthHandler.Me)
				private.Post("/logout", deps.AuthHandler.Logout)
			})

			authRoute.Group(func(private chi.Router) {
				private.Use(middleware.AuthRequired(deps.TokenManager))
				private.Get("/me", deps.AuthHandler.Me)
			})
		})

		api.Route("/organizer", func(org chi.Router) {
			org.Use(middleware.AuthRequired(deps.TokenManager))
			org.Use(middleware.RequireRole("organizer", "admin"))

			org.Post("/events", deps.EventHandler.Create)
			org.Post("/events/{id}/cancel", deps.EventHandler.CancelMine)
            org.Post("/events/{id}/close-registration", deps.EventHandler.CloseRegistrationMine)
			org.Get("/events", deps.EventHandler.ListMine)
			org.Get("/events/{id}", deps.EventHandler.GetMine)
			org.Get("/events/{id}/registrations", deps.RegistrationHandler.ListByEventForOrganizer)
            org.Put("/events/{id}", deps.EventHandler.UpdateMine)
			org.Get("/dashboard", deps.EventHandler.OrganizerDashboard)
        })

		api.Get("/categories", deps.CategoryHandler.ListActive)

		api.Route("/admin", func(admin chi.Router) {
			admin.Use(middleware.AuthRequired(deps.TokenManager))
			admin.Use(middleware.RequireRole("admin"))

			admin.Get("/events/pending", deps.EventHandler.ListPending)
			admin.Post("/events/{id}/approve", deps.EventHandler.Approve)
			admin.Post("/events/{id}/reject", deps.EventHandler.Reject)
			admin.Post("/events/{id}/request-changes", deps.EventHandler.RequestChanges)

			admin.Get("/categories", deps.CategoryHandler.ListAll)
			admin.Post("/categories", deps.CategoryHandler.Create)
			admin.Put("/categories/{id}", deps.CategoryHandler.Update)
			admin.Patch("/categories/{id}/status", deps.CategoryHandler.SetStatus)

			admin.Get("/users", deps.AdminUserHandler.List)
			admin.Get("/users/{id}", deps.AdminUserHandler.GetByID)
			admin.Post("/users/{id}/suspend", deps.AdminUserHandler.Suspend)
			admin.Post("/users/{id}/activate", deps.AdminUserHandler.Activate)
			admin.Get("/dashboard", deps.AdminDashboardHandler.Get)
		})

		api.Get("/events", deps.EventHandler.ListPublished)
        api.Get("/events/{id}", deps.EventHandler.GetPublished)

		api.Route("/events", func(events chi.Router) {
			events.Get("/", deps.EventHandler.ListPublished)
			events.Get("/{id}", deps.EventHandler.GetPublished)

			events.Group(func(private chi.Router) {
				private.Use(middleware.AuthRequired(deps.TokenManager))

				private.Post("/{id}/save", deps.SavedEventHandler.Save)
				private.Delete("/{id}/save", deps.SavedEventHandler.Unsave)

				private.Post("/{id}/rsvp", deps.RegistrationHandler.RSVP)
				private.Delete("/{id}/rsvp", deps.RegistrationHandler.Cancel)
			})
		})

		api.Group(func(private chi.Router) {
			private.Use(middleware.AuthRequired(deps.TokenManager))
			private.Get("/me/saved-events", deps.SavedEventHandler.ListMine)
			private.Get("/me/registrations", deps.RegistrationHandler.ListMine)
		})

		api.Get("/events/{id}/reviews", deps.ReviewHandler.ListByEvent)
		api.Get("/events/{id}/rating-summary", deps.ReviewHandler.Summary)

		api.Group(func(private chi.Router) {
			private.Use(middleware.AuthRequired(deps.TokenManager))
			private.Post("/events/{id}/reviews", deps.ReviewHandler.Create)
		})

		api.Group(func(private chi.Router) {
			private.Use(middleware.AuthRequired(deps.TokenManager))

			private.Get("/notifications", deps.NotificationHandler.ListMine)
			private.Patch("/notifications/{id}/read", deps.NotificationHandler.MarkRead)
			private.Patch("/notifications/read-all", deps.NotificationHandler.MarkAllRead)
		})

		api.Group(func(private chi.Router) {
			private.Use(middleware.AuthRequired(deps.TokenManager))
			private.Put("/users/me", deps.AuthHandler.UpdateProfile)
		})

	})

	return r
}