package riverclient

import (
	"database/sql"

	"github.com/riverqueue/river"
	"github.com/riverqueue/river/riverdriver/riverdatabasesql"
)

type RegisterWorkers func(*river.Workers)

func NewWorkerClient(database *sql.DB, register RegisterWorkers) (*river.Client[*sql.Tx], error) {
	workers := river.NewWorkers()
	if register != nil {
		register(workers)
	}
	return river.NewClient[*sql.Tx](riverdatabasesql.New(database), &river.Config{
		Queues:  map[string]river.QueueConfig{river.QueueDefault: {MaxWorkers: 10}},
		Workers: workers,
	})
}
