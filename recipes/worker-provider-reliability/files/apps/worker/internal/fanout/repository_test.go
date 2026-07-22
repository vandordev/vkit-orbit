package fanout

import (
	"strings"
	"testing"
)

func TestClaimQueryUsesPostgresSafeShortLock(t *testing.T) {
	if strings.Contains(claimNextSQL, "GROUP BY") || !strings.Contains(claimNextSQL, "FOR UPDATE OF item SKIP LOCKED") {
		t.Fatalf("unsafe claim query: %s", claimNextSQL)
	}
	if !strings.Contains(claimNextSQL, "::fanout_item_state") {
		t.Fatalf("claim query must explicitly cast state enum: %s", claimNextSQL)
	}
}

func TestAggregateStatesWaitsForActiveItemsAndClassifiesTerminalMixes(t *testing.T) {
	for _, testCase := range []struct { name string; states []ItemState; want ParentState }{
		{"success", []ItemState{StateSent, StateSent}, ParentCompleted},
		{"failed", []ItemState{StateFailed, StateUnknown}, ParentFailed},
		{"mixed", []ItemState{StateSent, StateFailed}, ParentPartiallyFailed},
		{"active", []ItemState{StateSent, StateProcessing}, ParentRunning},
	} {
		t.Run(testCase.name, func(t *testing.T) { if got := AggregateStates(testCase.states); got != testCase.want { t.Fatalf("got=%s want=%s", got, testCase.want) } })
	}
}
