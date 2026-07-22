package main

import (
	"context"
	"strings"
	"testing"

	"github.com/google/go-cmp/cmp"
)

func TestRunAppliesPrismaBeforeRiver(t *testing.T) {
	var calls []string
	err := run(context.Background(), "postgresql://example", func(_ context.Context, name string, args ...string) error {
		calls = append(calls, name+" "+strings.Join(args, " "))
		return nil
	}, func(context.Context, string) error {
		calls = append(calls, "river up")
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
	if diff := cmp.Diff([]string{"bun run --cwd packages/database db:migrate", "river up"}, calls); diff != "" {
		t.Fatal(diff)
	}
}

func TestRiverSchemaIsDedicated(t *testing.T) {
	if riverSchema != "river" {
		t.Fatalf("riverSchema = %q, want river", riverSchema)
	}
}
