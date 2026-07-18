package worker

import (
	"context"
	"testing"

	"github.com/riverqueue/river"
	"github.com/vandordev/vkit-orbit/internal/notify"
)

type notifyFunc func(context.Context, notify.Event) error

func (fn notifyFunc) Notify(ctx context.Context, event notify.Event) error { return fn(ctx, event) }

func TestExampleRealtimeNotificationWorkerNotifiesElysiaAfterSuccess(t *testing.T) {
	var got notify.Event
	job := &ExampleRealtimeNotificationWorker{Notifier: notifyFunc(func(_ context.Context, event notify.Event) error { got = event; return nil })}
	if err := job.Work(context.Background(), &river.Job[ExampleRealtimeNotificationArgs]{Args: ExampleRealtimeNotificationArgs{ResourceID: "r1", WorkspaceID: "w1"}}); err != nil {
		t.Fatal(err)
	}
	if got.ResourceID != "r1" || got.WorkspaceID != "w1" || got.Type != "resource.updated" {
		t.Fatalf("event = %#v", got)
	}
}
