package fanout

import (
	"context"
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

type fakeRepository struct{ items []*Item }
func (f *fakeRepository) ClaimNext(context.Context, string) (*Item, error) { for _, item := range f.items { if item.State == StatePending { item.State = StateProcessing; return item, nil } }; return nil, nil }
func (f *fakeRepository) PersistOutcome(_ context.Context, outcome Outcome) error { for _, item := range f.items { if item.ID == outcome.ItemID { item.State = outcome.State } }; return nil }
func (f *fakeRepository) HasPending(context.Context, string) (bool, error) { for _, item := range f.items { if item.State == StatePending { return true, nil } }; return false, nil }
func (f *fakeRepository) Aggregate(context.Context, string) (ParentState, error) { return ParentCompleted, nil }
type fakeProvider struct{}
func (fakeProvider) Deliver(context.Context, Item) error { return nil }
