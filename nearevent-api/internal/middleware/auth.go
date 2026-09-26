package middleware

import (
	"context"
	"net/http"
	"strings"

	"nearevent-api/internal/auth"
	"nearevent-api/internal/utils"
)

type contextKey string

const (
	ContextUserID contextKey = "user_id"
	ContextRole   contextKey = "role"
	ContextEmail  contextKey = "email"
)

func AuthRequired(tokenManager *auth.TokenManager) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			header := r.Header.Get("Authorization")
			if header == "" || !strings.HasPrefix(header, "Bearer ") {
				utils.Error(w, http.StatusUnauthorized, "Missing or invalid authorization header", nil)
				return
			}

			tokenStr := strings.TrimPrefix(header, "Bearer ")
			claims, err := tokenManager.Parse(tokenStr)
			if err != nil {
				utils.Error(w, http.StatusUnauthorized, "Invalid or expired token", nil)
				return
			}

			ctx := context.WithValue(r.Context(), ContextUserID, claims.UserID.String())
			ctx = context.WithValue(ctx, ContextRole, claims.Role)
			ctx = context.WithValue(ctx, ContextEmail, claims.Email)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func OptionalUserID(r *http.Request, tokenManager *auth.TokenManager) string {
	if tokenManager == nil {
		return ""
	}
	header := r.Header.Get("Authorization")
	if header == "" || !strings.HasPrefix(header, "Bearer ") {
		return ""
	}
	tokenStr := strings.TrimPrefix(header, "Bearer ")
	claims, err := tokenManager.Parse(tokenStr)
	if err != nil {
		return ""
	}
	return claims.UserID.String()
}

func GetUserID(ctx context.Context) string {
	if v := ctx.Value(ContextUserID); v != nil {
		return v.(string)
	}
	return ""
}

func GetRole(ctx context.Context) string {
	if v := ctx.Value(ContextRole); v != nil {
		return v.(string)
	}
	return ""
}