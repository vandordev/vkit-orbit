package riverclient

import (
	"database/sql"
	"testing"
)

func TestNewWorkerClientBuildsWithDefaultQueue(t *testing.T) {
	database := &sql.DB{}
	client, err := NewWorkerClient(database, nil)
	if err != nil {
		t.Fatal(err)
	}
	if client == nil {
		t.Fatal("client = nil")
	}
}

func TestRiverSchemaIsDedicated(t *testing.T) {
	if riverSchema != "river" {
		t.Fatalf("riverSchema = %q, want river", riverSchema)
	}
}
