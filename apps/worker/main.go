package main

import (
	"context"
	"database/sql"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/riverqueue/river"
	"github.com/vandordev/vkit-orbit/internal/notify"
	riverclient "github.com/vandordev/vkit-orbit/internal/river"
	workerjobs "github.com/vandordev/vkit-orbit/internal/worker"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		fmt.Fprintln(os.Stderr, "DATABASE_URL is required")
		os.Exit(1)
	}
	database, err := sql.Open("pgx", databaseURL)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	defer database.Close()
	if err := database.PingContext(ctx); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	notifier := notify.NewNotifier(os.Getenv("WORKER_NOTIFICATION_URL"), os.Getenv("WORKER_NOTIFICATION_API_KEY"), http.DefaultClient)
	client, err := riverclient.NewWorkerClient(database, func(workers *river.Workers) {
		river.AddWorker(workers, &workerjobs.ExampleRealtimeNotificationWorker{Notifier: notifier})
	})
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	if err := client.Start(ctx); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	<-client.Stopped()
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	_ = client.Stop(shutdownCtx)
}
