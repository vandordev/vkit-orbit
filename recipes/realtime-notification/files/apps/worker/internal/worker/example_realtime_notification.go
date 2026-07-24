package worker

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/riverqueue/river"
	"github.com/vandordev/vkit-orbit/internal/notify"
)

type ExampleRealtimeNotificationArgs struct {
	ResourceID  string `json:"resourceId"`
	WorkspaceID string `json:"workspaceId"`
}

func (ExampleRealtimeNotificationArgs) Kind() string { return "example.realtime-notification.v1" }

type ExampleRealtimeNotificationWorker struct {
	river.WorkerDefaults[ExampleRealtimeNotificationArgs]
	Notifier notify.Notifier
}

func (w *ExampleRealtimeNotificationWorker) Work(ctx context.Context, job *river.Job[ExampleRealtimeNotificationArgs]) error {
	if strings.TrimSpace(job.Args.ResourceID) == "" || strings.TrimSpace(job.Args.WorkspaceID) == "" {
		return fmt.Errorf("resourceId and workspaceId are required")
	}
	event := notify.Event{Type: "resource.updated", EventID: uuid.NewString(), OccurredAt: time.Now().UTC().Format(time.RFC3339Nano), ResourceID: job.Args.ResourceID, WorkspaceID: job.Args.WorkspaceID}
	return w.Notifier.Notify(ctx, event)
}
