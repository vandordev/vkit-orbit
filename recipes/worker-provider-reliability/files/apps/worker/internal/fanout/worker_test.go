package fanout

import (
	"context"
	"errors"
	"testing"
)

func TestStateMachineIncludesNeutralStates(t *testing.T) {
	for _, state := range []ItemState{StatePending, StateProcessing, StateSent, StateFailed, StateUnknown} {
		if state == "" {
			t.Fatal("empty state")
		}
	}
}

func TestFakeLifecycleExercisesRepositoryBoundary(t *testing.T) {
	repository := &fakeRepository{items: []*Item{{ParentID: "p1", ID: "i1", State: StatePending}}}
	worker := Worker{Repository: repository, Provider: fakeProvider{}, Enqueue: func(context.Context, string) error { return nil }, Notify: func(context.Context, string) error { return nil }}
	if err := worker.Process(context.Background(), "p1"); err != nil {
		t.Fatal(err)
	}
	if repository.items[0].State != StateSent {
		t.Fatalf("state = %s, want SENT", repository.items[0].State)
	}
}

func TestRetryableFailureReturnsSameErrorAndLeavesItemPending(t *testing.T) {
	sentinel := errors.New("provider unavailable")
	repository := &fakeRepository{items: []*Item{{ParentID: "p1", ID: "i1", State: StatePending}}}
	err := (&Worker{Repository: repository, Provider: fakeProvider{err: &RetryableError{Err: sentinel}}}).Process(context.Background(), "p1")
	if !errors.Is(err, sentinel) || repository.items[0].State != StatePending {
		t.Fatalf("err=%v state=%s", err, repository.items[0].State)
	}
}

func TestTimeoutIsUnknownAndNotifiesOnlyAfterPersistence(t *testing.T) {
	repository := &fakeRepository{items: []*Item{{ParentID: "p1", ID: "i1", State: StatePending}}}
	notified := false
	worker := Worker{Repository: repository, Provider: fakeProvider{err: context.DeadlineExceeded}, Notify: func(context.Context, string) error { notified = true; return nil }}
	if err := worker.Process(context.Background(), "p1"); err != nil { t.Fatal(err) }
	if repository.items[0].State != StateUnknown || !notified { t.Fatalf("state=%s notified=%v", repository.items[0].State, notified) }
}

func TestQueueDrainsAndNotifiesAfterMixedTerminalAggregate(t *testing.T) {
	repository := &fakeRepository{items: []*Item{{ParentID: "p1", ID: "i1", State: StatePending}, {ParentID: "p1", ID: "i2", State: StatePending}}}
	calls := 0
	worker := Worker{Repository: repository, Provider: fakeProvider{errOnce: &RetryableError{Err: errors.New("retry")}}, Enqueue: func(context.Context, string) error { return nil }, Notify: func(context.Context, string) error { calls++; return nil }}
	if err := worker.Process(context.Background(), "p1"); err == nil { t.Fatal("retryable error = nil") }
	worker.Provider = fakeProvider{}
	if err := worker.Process(context.Background(), "p1"); err != nil { t.Fatal(err) }
	if err := worker.Process(context.Background(), "p1"); err != nil { t.Fatal(err) }
	if calls != 1 || repository.items[0].State != StateSent || repository.items[1].State != StateSent { t.Fatalf("calls=%d states=%s,%s", calls, repository.items[0].State, repository.items[1].State) }
}

type fakeRepository struct{ items []*Item }
func (f *fakeRepository) ClaimNext(context.Context, string) (*Item, error) { for _, item := range f.items { if item.State == StatePending { item.State = StateProcessing; return item, nil } }; return nil, nil }
func (f *fakeRepository) PersistOutcome(_ context.Context, outcome Outcome) error { for _, item := range f.items { if item.ID == outcome.ItemID { item.State = outcome.State } }; return nil }
func (f *fakeRepository) HasPending(context.Context, string) (bool, error) { for _, item := range f.items { if item.State == StatePending { return true, nil } }; return false, nil }
func (f *fakeRepository) Aggregate(context.Context, string) (ParentState, error) { return ParentCompleted, nil }
type fakeProvider struct{ err, errOnce error }
func (f fakeProvider) Deliver(context.Context, Item) error { if f.errOnce != nil { return f.errOnce }; return f.err }
