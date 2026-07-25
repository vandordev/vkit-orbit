# Scheduler

The Bun scheduler creates River TypeScript producers and owns only schedules.
It does not import Prisma or application usecases. The example schedule is
disabled unless `ENABLE_EXAMPLE_SCHEDULE=true`; schedules return cleanup
functions and handle SIGINT/SIGTERM.
