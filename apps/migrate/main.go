package main

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"os/signal"
	"syscall"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/riverqueue/river/riverdriver/riverdatabasesql"
	"github.com/riverqueue/river/rivermigrate"
)

type runCommand func(context.Context, string, ...string) error
type runRiverMigration func(context.Context, string) error

const riverSchema = "river"

func run(ctx context.Context, databaseURL string, command runCommand, migrate runRiverMigration) error {
	if err := command(ctx, "bun", "run", "--cwd", "packages/database", "db:migrate"); err != nil {
		return fmt.Errorf("apply prisma migrations: %w", err)
	}
	if err := migrate(ctx, databaseURL); err != nil {
		return fmt.Errorf("apply river migrations: %w", err)
	}
	return nil
}

func runCommandContext(ctx context.Context, name string, args ...string) error {
	return exec.CommandContext(ctx, name, args...).Run()
}

func migrateRiver(ctx context.Context, databaseURL string) error {
	database, err := sql.Open("pgx", databaseURL)
	if err != nil {
		return err
	}
	defer database.Close()

	if err := database.PingContext(ctx); err != nil {
		return err
	}
	migrator, err := rivermigrate.New(riverdatabasesql.New(database), &rivermigrate.Config{Schema: riverSchema})
	if err != nil {
		return err
	}
	_, err = migrator.Migrate(ctx, rivermigrate.DirectionUp, nil)
	return err
}

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		fmt.Fprintln(os.Stderr, "DATABASE_URL is required")
		os.Exit(1)
	}
	if err := run(ctx, databaseURL, runCommandContext, migrateRiver); err != nil && !errors.Is(err, context.Canceled) {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
