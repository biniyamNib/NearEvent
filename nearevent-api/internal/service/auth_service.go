package service

import (
	"context"
	"errors"
	"strings"
	"fmt"
	"os"

	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"time"

	"nearevent-api/internal/auth"
	"nearevent-api/internal/dto"
	"nearevent-api/internal/models"
	"nearevent-api/internal/repository"
	"nearevent-api/internal/utils"
	"nearevent-api/internal/email"

	"github.com/google/uuid"
)

var (
	ErrEmailAlreadyExists = errors.New("email already registered")
	ErrInvalidCredentials = errors.New("Incorrect email or password. Please try again.")
	ErrUserSuspended      = errors.New("account is suspended")
	ErrInvalidRole        = errors.New("invalid role")
)

type AuthService struct {
	users        *repository.UserRepository
	tokenManager *auth.TokenManager
}

func NewAuthService(users *repository.UserRepository, tokenManager *auth.TokenManager) *AuthService {
	return &AuthService{
		users:        users,
		tokenManager: tokenManager,
	}
}

func (s *AuthService) Register(ctx context.Context, req dto.RegisterRequest) (*dto.AuthResponse, error) {
	fullName := strings.TrimSpace(req.FullName)
	email := utils.NormalizeEmail(req.Email)
	password := strings.TrimSpace(req.Password)

	if err := utils.ValidateRequired(fullName, "full_name"); err != nil {
		return nil, err
	}
	if err := utils.ValidateEmail(email); err != nil {
		return nil, err
	}
	if err := utils.ValidatePassword(password); err != nil {
		return nil, err
	}

	exists, err := s.users.EmailExists(ctx, email)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrEmailAlreadyExists
	}

	role := models.RoleAttendee
	switch strings.ToLower(strings.TrimSpace(req.Role)) {
	case "", "attendee":
		role = models.RoleAttendee
	case "organizer":
		role = models.RoleOrganizer
	case "admin":
		return nil, errors.New("admin registration is not allowed")
	default:
		return nil, ErrInvalidRole
	}

	hash, err := auth.HashPassword(password)
	if err != nil {
		return nil, err
	}

	user := repository.NewUser(fullName, email, hash, role)
	if err := s.users.Create(ctx, user); err != nil {
		return nil, err
	}

	token, err := s.tokenManager.Generate(user.ID, string(user.Role), user.Email)
	if err != nil {
		return nil, err
	}

	return &dto.AuthResponse{
		Token: token,
		User:  mapUserResponse(user),
	}, nil
}

func (s *AuthService) Login(ctx context.Context, req dto.LoginRequest) (*dto.AuthResponse, error) {
	email := utils.NormalizeEmail(req.Email)
	password := strings.TrimSpace(req.Password)

	if err := utils.ValidateEmail(email); err != nil {
		return nil, err
	}
	if err := utils.ValidateRequired(password, "password"); err != nil {
		return nil, err
	}

	user, err := s.users.GetByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, repository.ErrUserNotFound) {
			return nil, ErrInvalidCredentials
		}
		return nil, err
	}

	if user.Status == models.UserStatusSuspended {
		return nil, ErrUserSuspended
	}

	if !auth.CheckPassword(password, user.PasswordHash) {
		return nil, ErrInvalidCredentials
	}

	token, err := s.tokenManager.Generate(user.ID, string(user.Role), user.Email)
	if err != nil {
		return nil, err
	}

	return &dto.AuthResponse{
		Token: token,
		User:  mapUserResponse(user),
	}, nil
}

func (s *AuthService) Me(ctx context.Context, userID string) (*dto.UserResponse, error) {
	id, err := uuid.Parse(userID)
	if err != nil {
		return nil, err
	}

	user, err := s.users.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	resp := mapUserResponse(user)
	return &resp, nil
}

func mapUserResponse(user *models.User) dto.UserResponse {
	return dto.UserResponse{
		ID:        user.ID.String(),
		FullName:  user.FullName,
		Email:     user.Email,
		Role:      string(user.Role),
		Status:    string(user.Status),
		AvatarURL: user.AvatarURL,
	}
}

func (s *AuthService) ForgotPassword(ctx context.Context, req dto.ForgotPasswordRequest) (string, error) {
	emailAddr := utils.NormalizeEmail(req.Email)
	if err := utils.ValidateEmail(emailAddr); err != nil {
		return "", err
	}

	user, err := s.users.GetByEmail(ctx, emailAddr)
	if err != nil {
		if errors.Is(err, repository.ErrUserNotFound) {
			// Still return success to client (don't reveal missing emails)
			return "", nil
		}
		return "", err
	}

	// Optional: attendee-only for mobile public reset
	// if user.Role != "attendee" {
	// 	return "", nil
	// }

	rawToken, err := generateResetToken()
	if err != nil {
		return "", err
	}

	hash := hashToken(rawToken)
	expiresAt := time.Now().UTC().Add(1 * time.Hour)

	if err := s.users.SavePasswordResetToken(ctx, user.ID, hash, expiresAt); err != nil {
		return "", err
	}

	base := os.Getenv("APP_RESET_URL")
	if base == "" {
		base = "http://localhost:5173/reset-password"
	}
	link := base + "?token=" + rawToken

	err = email.SendPasswordReset(user.Email, link)
	if err != nil {
		fmt.Println("RESEND ERROR:", err)
	} else {
		fmt.Println("RESEND OK for", user.Email, link)
	}
	return "", nil
}

func (s *AuthService) ResetPassword(ctx context.Context, req dto.ResetPasswordRequest) error {
	token := strings.TrimSpace(req.Token)
	newPassword := strings.TrimSpace(req.NewPassword)

	if err := utils.ValidateRequired(token, "token"); err != nil {
		return err
	}
	if err := utils.ValidatePassword(newPassword); err != nil {
		return err
	}

	tokenHash := hashToken(token)

	resetToken, err := s.users.GetValidPasswordResetToken(ctx, tokenHash)
	if err != nil {
		return err
	}

	passwordHash, err := auth.HashPassword(newPassword)
	if err != nil {
		return err
	}

	if err := s.users.UpdatePassword(ctx, resetToken.UserID, passwordHash); err != nil {
		return err
	}

	return s.users.MarkPasswordResetTokenUsed(ctx, resetToken.ID)
}

func generateResetToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func hashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

func (s *AuthService) UpdateProfile(ctx context.Context, userID string, req dto.UpdateProfileRequest) (*dto.UserResponse, error) {
	id, err := uuid.Parse(userID)
	if err != nil {
		return nil, errors.New("invalid user id")
	}

	fullName := strings.TrimSpace(req.FullName)
	email := utils.NormalizeEmail(req.Email)

	if err := utils.ValidateRequired(fullName, "full_name"); err != nil {
		return nil, err
	}
	if err := utils.ValidateEmail(email); err != nil {
		return nil, err
	}

	user, err := s.users.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// If email changed, ensure it is unique
	if email != user.Email {
		exists, err := s.users.EmailExists(ctx, email)
		if err != nil {
			return nil, err
		}
		if exists {
			return nil, ErrEmailAlreadyExists
		}
	}

	user.FullName = fullName
	user.Email = email
	user.AvatarURL = req.AvatarURL
	user.UpdatedAt = time.Now().UTC()

	if err := s.users.UpdateProfile(ctx, user); err != nil {
		return nil, err
	}

	resp := mapUserResponse(user)
	return &resp, nil
}