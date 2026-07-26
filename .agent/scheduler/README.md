# Scheduler

The Bun scheduler creates River TypeScript producers and owns only schedules.
It does not perform domain mutations or import application usecases. Its queue
client and runtime resources are created once per scheduler process. The example
schedule is disabled unless `ENABLE_EXAMPLE_SCHEDULE=true`; schedules return
cleanup functions and handle SIGINT/SIGTERM.
