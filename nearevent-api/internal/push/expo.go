package push

import (
	"bytes"
	"encoding/json"
	"net/http"
)

type expoMessage struct {
	To    string `json:"to"`
	Title string `json:"title"`
	Body  string `json:"body"`
	Data  any    `json:"data,omitempty"`
	Sound string `json:"sound,omitempty"`
}

func SendExpo(tokens []string, title, body string, data any) {
	if len(tokens) == 0 {
		return
	}

	messages := make([]expoMessage, 0, len(tokens))
	for _, t := range tokens {
		messages = append(messages, expoMessage{
			To:    t,
			Title: title,
			Body:  body,
			Data:  data,
			Sound: "default",
		})
	}

	raw, err := json.Marshal(messages)
	if err != nil {
		return
	}

	req, err := http.NewRequest(http.MethodPost, "https://exp.host/--/api/v2/push/send", bytes.NewReader(raw))
	if err != nil {
		return
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return
	}
	defer resp.Body.Close()
	// optional: log resp.StatusCode
}