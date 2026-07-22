package fanout

import (
	"context"
	"errors"
	"fmt"
)

type RetryableError struct{ Err error }
func (e *RetryableError) Error() string { return e.Err.Error() }
func (e *RetryableError) Unwrap() error { return e.Err }
type UnknownError struct{ Err error }
func (e *UnknownError) Error() string { return e.Err.Error() }
func (e *UnknownError) Unwrap() error { return e.Err }

type Provider interface { Deliver(context.Context, Item) error }
type EnqueueFunc func(context.Context, string) error
type NotifyFunc func(context.Context, string) error

type Worker struct { Repository Repository; Provider Provider; Enqueue EnqueueFunc; Notify NotifyFunc }

func (w Worker) Process(ctx context.Context, parentID string) error {
	item, err := w.Repository.ClaimNext(ctx, parentID)
	if err != nil || item == nil { return err }
	var providerErr error
	outcome := Outcome{ParentID: parentID, ItemID: item.ID, IdempotencyKey: item.IdempotencyKey, State: StateSent}
	if err = w.Provider.Deliver(ctx, *item); err != nil {
		providerErr = err
		outcome.ErrorMessage = err.Error()
		var retryable *RetryableError
		var unknown *UnknownError
		switch {
		case errors.As(err, &unknown), errors.Is(err, context.DeadlineExceeded), errors.Is(err, context.Canceled):
			outcome.State = StateUnknown
		case errors.As(err, &retryable):
			outcome.State = StatePending
		default:
			outcome.State = StateFailed
		}
	}
	if err := w.Repository.PersistOutcome(ctx, outcome); err != nil { return err }
	pending, err := w.Repository.HasPending(ctx, parentID)
	if err != nil { return err }
	if pending && w.Enqueue != nil {
		if err := w.Enqueue(ctx, parentID); err != nil { return err }
	}
	state, err := w.Repository.Aggregate(ctx, parentID)
	if err != nil { return err }
	if !pending && (state == ParentCompleted || state == ParentFailed || state == ParentPartiallyFailed) && w.Notify != nil {
		if err := w.Notify(ctx, parentID); err != nil { return fmt.Errorf("notify completed fanout: %w", err) }
	}
	if outcome.State == StatePending {
		return providerErr
	}
	return nil
}
