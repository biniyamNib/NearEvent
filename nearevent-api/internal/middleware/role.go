package middleware

import (
	"net/http"

	"nearevent-api/internal/utils"
)

func RequireRole(roles ...string) func(http.Handler) http.Handler {
	allowed := map[string]bool{}
	for _, role := range roles {
		allowed[role] = true
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			role := GetRole(r.Context())
			if role == "" || !allowed[role] {
				utils.Error(w, http.StatusForbidden, "Forbidden", nil)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}