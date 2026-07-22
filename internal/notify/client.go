package notify

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
)

type Event struct {
	Type        string `json:"type"`
	EventID     string `json:"eventId"`
	OccurredAt  string `json:"occurredAt"`
	ResourceID  string `json:"resourceId"`
	WorkspaceID string `json:"workspaceId"`
}

type Notifier interface {
	Notify(context.Context, Event) error
}

type Client struct {
	baseURL string
	apiKey  string
	client  *http.Client
}

func NewNotifier(baseURL, apiKey string, client *http.Client) *Client {
	if client == nil {
		client = http.DefaultClient
	}
	baseURL = strings.TrimRight(baseURL, "/")
	baseURL = strings.TrimSuffix(baseURL, "/api/internal/worker-events")
	return &Client{baseURL: baseURL, apiKey: apiKey, client: client}
}

func (c *Client) Notify(ctx context.Context, event Event) error {
	body, err := json.Marshal(event)
	if err != nil {
		return err
	}
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/api/internal/worker-events", bytes.NewReader(body))
	if err != nil {
		return err
	}
	request.Header.Set("content-type", "application/json")
	request.Header.Set("x-worker-notification-key", c.apiKey)
	response, err := c.client.Do(request)
	if err != nil {
		return err
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusAccepted {
		return fmt.Errorf("worker event notification returned HTTP %d", response.StatusCode)
	}
	return nil
}
