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

// low-level Resend API call
func send(to, subject, html string) error {
	apiKey := os.Getenv("RESEND_API_KEY")
	from := os.Getenv("EMAIL_FROM")
	if apiKey == "" || from == "" {
		return fmt.Errorf("email not configured")
	}
	if to == "" {
		return fmt.Errorf("missing recipient")
	}

	body := resendPayload{
		From:    from,
		To:      []string{to},
		Subject: subject,
		Html:    html,
	}

	raw, err := json.Marshal(body)
	if err != nil {
		return err
	}

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

func SendPasswordReset(toEmail, resetLink string) error {
	subject := "Reset your NearEvent password"
	html := fmt.Sprintf(`
		<p>Hello,</p>
		<p>We received a request to reset your NearEvent password.</p>
		<p><a href="%s">Reset password</a></p>
		<p>If you did not request this, you can ignore this email.</p>
		<p>This link expires in 1 hour.</p>
	`, resetLink)
	return send(toEmail, subject, html)
}

func SendEventReminder24h(to, eventTitle, whenText, venue string) error {
	subject := "Reminder: " + eventTitle + " is tomorrow"
	html := fmt.Sprintf(`
		<p>Hi,</p>
		<p>This is a reminder that <strong>%s</strong> is coming up.</p>
		<p><strong>When:</strong> %s<br/>
		<strong>Where:</strong> %s</p>
		<p>See you there!</p>
		<p>— NearEvent</p>
	`, eventTitle, whenText, venue)
	return send(to, subject, html)
}

func SendEventReminder1h(to, eventTitle, whenText, venue string) error {
	subject := "Starting soon: " + eventTitle
	html := fmt.Sprintf(`
		<p>Hi,</p>
		<p><strong>%s</strong> starts in about an hour.</p>
		<p><strong>When:</strong> %s<br/>
		<strong>Where:</strong> %s</p>
		<p>— NearEvent</p>
	`, eventTitle, whenText, venue)
	return send(to, subject, html)
}

func SendReviewPrompt(to, eventTitle string) error {
	subject := "How was " + eventTitle + "?"
	html := fmt.Sprintf(`
		<p>Hi,</p>
		<p>Thanks for attending <strong>%s</strong>.</p>
		<p>We’d love your feedback — open the NearEvent app and leave a short review.</p>
		<p>— NearEvent</p>
	`, eventTitle)
	return send(to, subject, html)
}