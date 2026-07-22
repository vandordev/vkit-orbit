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
