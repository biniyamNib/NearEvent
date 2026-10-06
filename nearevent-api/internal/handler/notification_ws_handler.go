package handler

import (
	"net/http"

	"nearevent-api/internal/auth"
	"nearevent-api/internal/realtime"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true }, 
}

type NotificationWSHandler struct {
	hub    *realtime.Hub
	tokens *auth.TokenManager
}

func NewNotificationWSHandler(hub *realtime.Hub, tokens *auth.TokenManager) *NotificationWSHandler {
	return &NotificationWSHandler{hub: hub, tokens: tokens}
}

func (h *NotificationWSHandler) Stream(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if token == "" {
		http.Error(w, "missing token", http.StatusUnauthorized)
		return
	}

	claims, err := h.tokens.Parse(token)
	if err != nil {
		http.Error(w, "invalid token", http.StatusUnauthorized)
		return
	}

	userID, err := uuid.Parse(claims.UserID.String())
	if err != nil {
		// if UserID is already uuid.UUID in claims:
		userID = claims.UserID
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}

	h.hub.Register(userID, conn)
	defer h.hub.Unregister(userID, conn)

	// Keep connection alive; ignore client messages for MVP
	for {
		if _, _, err := conn.ReadMessage(); err != nil {
			break
		}
	}
}