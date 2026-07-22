package fanout

import "context"

type ItemState string
const (
	StatePending ItemState = "PENDING"
	StateProcessing ItemState = "PROCESSING"
	StateSent ItemState = "SENT"
	StateFailed ItemState = "FAILED"
	StateUnknown ItemState = "UNKNOWN"
)

type ParentState string
const (
	ParentRunning ParentState = "RUNNING"
	ParentCompleted ParentState = "COMPLETED"
	ParentFailed ParentState = "FAILED"
	ParentPartiallyFailed ParentState = "PARTIALLY_FAILED"
)

type Item struct { ParentID, ID, IdempotencyKey string; State ItemState }
type Outcome struct { ParentID, ItemID, IdempotencyKey string; State ItemState; ErrorMessage string }

type Repository interface {
	ClaimNext(context.Context, string) (*Item, error)
	PersistOutcome(context.Context, Outcome) error
	HasPending(context.Context, string) (bool, error)
	Aggregate(context.Context, string) (ParentState, error)
}

// The claim transaction must lock one item briefly, mark it PROCESSING, and commit
// before the provider call. It must never hold a database lock over network I/O.
const claimNextSQL = `SELECT item.id, item.parent_id, item.idempotency_key FROM fanout_items AS item WHERE item.parent_id = $1::text AND item.state = $2::fanout_item_state ORDER BY item.created_at, item.id LIMIT 1 FOR UPDATE OF item SKIP LOCKED`

const persistOutcomeSQL = `UPDATE fanout_items SET state = $2::fanout_item_state, last_error = NULLIF($3, '') WHERE id = $1::text AND state = 'PROCESSING'::fanout_item_state`
