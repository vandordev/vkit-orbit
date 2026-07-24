package main

import (
	"os"
	"strings"
	"testing"
)

func TestWorkerRuntimePackageExists(t *testing.T) {}

func TestBaselineWorkerDoesNotRegisterRealtimeExample(t *testing.T) {
	source, err := os.ReadFile("main.go")
	if err != nil {
		t.Fatal(err)
	}
	contents := string(source)
	for _, unwanted := range []string{"ExampleRealtimeNotificationWorker", "notify.NewNotifier"} {
		if strings.Contains(contents, unwanted) {
			t.Fatalf("baseline worker must not contain %q", unwanted)
		}
	}
}
