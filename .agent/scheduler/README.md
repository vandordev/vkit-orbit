# Scheduler

The Bun scheduler creates BullMQ producers and owns only schedules.
It does not perform domain mutations or import application usecases. Its queue
client and runtime resources are created once per scheduler process from typed
app/Redis config only. No database dependency or example-schedule flag is active;
installed schedules handle lifecycle cleanup and SIGINT/SIGTERM.
