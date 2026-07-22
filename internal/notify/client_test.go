package notify

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func validEvent() Event {
	return Event{Type: "resource.updated", EventID: "event-1", OccurredAt: time.Now().UTC().Format(time.RFC3339Nano), ResourceID: "r1", WorkspaceID: "w1"}
}

func TestNotifierPostsCompletionToElysia(t *testing.T) {
	request := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if got := r.Header.Get("X-Worker-Notification-Key"); got != "worker-key" {
			t.Fatalf("key = %q", got)
		}
		if r.URL.Path != "/api/internal/worker-events" {
			t.Fatalf("path = %s", r.URL.Path)
		}
		w.WriteHeader(http.StatusAccepted)
	}))
	defer request.Close()
	if err := NewNotifier(request.URL, "worker-key", request.Client()).Notify(context.Background(), validEvent()); err != nil {
		t.Fatal(err)
	}
}

func TestNotifierAcceptsConfiguredWorkerEventsEndpoint(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/internal/worker-events" {
			t.Fatalf("path = %s", r.URL.Path)
		}
		w.WriteHeader(http.StatusAccepted)
	}))
	defer server.Close()
	if err := NewNotifier(server.URL+"/api/internal/worker-events", "worker-key", server.Client()).Notify(context.Background(), validEvent()); err != nil {
		t.Fatal(err)
	}
}

func TestNotifierReturnsErrorForRetryableGatewayFailure(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(http.StatusServiceUnavailable) }))
	defer server.Close()
	if err := NewNotifier(server.URL, "worker-key", server.Client()).Notify(context.Background(), validEvent()); err == nil {
		t.Fatal("Notify() error = nil")
	}
}
