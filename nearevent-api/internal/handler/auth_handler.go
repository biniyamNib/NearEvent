package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"nearevent-api/internal/dto"
	"nearevent-api/internal/middleware"
	"nearevent-api/internal/repository"
	"nearevent-api/internal/service"
	"nearevent-api/internal/utils"
)

type AuthHandler struct {
	authService *service.AuthService
}

func NewAuthHandler(authService *service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req dto.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.Error(w, http.StatusBadRequest, "Invalid request body", nil)
		return
	}

	res, err := h.authService.Register(r.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrEmailAlreadyExists):
			utils.Error(w, http.StatusConflict, err.Error(), nil)
		default:
			utils.Error(w, http.StatusBadRequest, err.Error(), nil)
		}
		return
	}

	utils.Success(w, http.StatusCreated, "Registration successful", res)
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req dto.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.Error(w, http.StatusBadRequest, "Invalid request body", nil)
		return
	}

	res, err := h.authService.Login(r.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrInvalidCredentials):
			utils.Error(w, http.StatusUnauthorized, err.Error(), nil)
		case errors.Is(err, service.ErrUserSuspended):
			utils.Error(w, http.StatusForbidden, err.Error(), nil)
		default:
			utils.Error(w, http.StatusBadRequest, err.Error(), nil)
		}
		return
	}

	utils.Success(w, http.StatusOK, "Login successful", res)
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		utils.Error(w, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	res, err := h.authService.Me(r.Context(), userID)
	if err != nil {
		utils.Error(w, http.StatusNotFound, "User not found", nil)
		return
	}

	utils.Success(w, http.StatusOK, "Current user", res)
}

func (h *AuthHandler) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var req dto.ForgotPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.Error(w, http.StatusBadRequest, "Invalid request body", nil)
		return
	}

	token, err := h.authService.ForgotPassword(r.Context(), req)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error(), nil)
		return
	}

	// In production, send email and do not return token
	data := map[string]string{
		"message": "If the email exists, reset instructions have been sent",
	}
	if token != "" {
		data["debug_reset_token"] = token
	}

	utils.Success(w, http.StatusOK, "Password reset initiated", data)
}

func (h *AuthHandler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	var req dto.ResetPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.Error(w, http.StatusBadRequest, "Invalid request body", nil)
		return
	}

	if err := h.authService.ResetPassword(r.Context(), req); err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error(), nil)
		return
	}

	utils.Success(w, http.StatusOK, "Password reset successful", nil)
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	// JWT is stateless; client should discard the token.
	utils.Success(w, http.StatusOK, "Logout successful", nil)
}

func (h *AuthHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		utils.Error(w, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	var req dto.UpdateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.Error(w, http.StatusBadRequest, "Invalid request body", nil)
		return
	}

	res, err := h.authService.UpdateProfile(r.Context(), userID, req)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrEmailAlreadyExists):
			utils.Error(w, http.StatusConflict, err.Error(), nil)
		case errors.Is(err, repository.ErrUserNotFound):
			utils.Error(w, http.StatusNotFound, "User not found", nil)
		default:
			utils.Error(w, http.StatusBadRequest, err.Error(), nil)
		}
		return
	}

	utils.Success(w, http.StatusOK, "Profile updated", res)
}