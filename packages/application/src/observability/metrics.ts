export const metricNames = [
	"http_requests_total",
	"http_request_duration_ms",
	"queue_depth",
	"queue_oldest_age_ms",
	"stalled_jobs_total",
	"outbox_depth",
	"outbox_oldest_age_ms",
	"stage_duration_ms",
	"processing_outcomes_total",
	"recovery_total",
	"webhook_outcomes_total",
	"storage_operation_duration_ms",
	"cleanup_failures_total",
] as const;

export type MetricName = (typeof metricNames)[number];
export type MetricSample = { name: MetricName; value: number; labels?: Record<string, string> };

export function metric(name: MetricName, value = 1, labels?: Record<string, string>): MetricSample {
	return { name, value, ...(labels ? { labels } : {}) };
}
