package email

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

type resendPayload struct {
	From    string   `json:"from"`
	To      []string `json:"to"`
	Subject string   `json:"subject"`
	Html    string   `json:"html"`
}

func SendPasswordReset(toEmail, resetLink string) error {
	apiKey := os.Getenv("RESEND_API_KEY")
	from := os.Getenv("EMAIL_FROM")
	if apiKey == "" || from == "" {
		return fmt.Errorf("email not configured")
	}

	body := resendPayload{
		From:    from,
		To:      []string{toEmail},
		Subject: "Reset your NearEvent password",
		Html: fmt.Sprintf(`
			<p>Hello,</p>
			<p>We received a request to reset your NearEvent password.</p>
			<p><a href="%s">Reset password</a></p>
			<p>If you did not request this, you can ignore this email.</p>
			<p>This link expires in 1 hour.</p>
		`, resetLink),
	}

	raw, _ := json.Marshal(body)
	req, err := http.NewRequest(http.MethodPost, "https://api.resend.com/emails", bytes.NewReader(raw))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	if res.StatusCode >= 300 {
		return fmt.Errorf("resend failed with status %d", res.StatusCode)
	}
	return nil
}