# Scheduler integration

Copy `../apps/scheduler/src/schedules.ts` and pass its `registerSchedules`
function through `runScheduler({ register, disconnect })`. Set `intervalMs`
from recipe-local configuration; do not add a baseline config key or default
schedule.
