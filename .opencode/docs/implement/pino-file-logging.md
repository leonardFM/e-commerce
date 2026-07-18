# Pino File Logging Implementation

Source task: `.opencode/docs/task/pino-file-logging.md`
Source plan: `.opencode/docs/plan/pino-file-logging-plan.md`

## Summary

- Added `LOG_DESTINATION` and `LOG_FILE_PATH` support to `lib/logger.ts`.
- When `LOG_DESTINATION=file`, Pino writes JSON Lines logs to `LOG_FILE_PATH`, defaulting to `logs/app.jsonl`.
- Logger creates the log file parent directory automatically before initializing file destination.
- Default behavior remains stdout logging when `LOG_DESTINATION` is not `file`.
- Preserved existing `LOG_LEVEL`, redaction paths, and `logHash()` behavior.
- Updated `.env.example`, `.gitignore`, and `AGENTS.md` for file logging workflow.

## Changed Files

- `lib/logger.ts`
- `.env.example`
- `.gitignore`
- `AGENTS.md`
- `tests/logger.test.ts`
- `.opencode/docs/task/pino-file-logging.md`
- `.opencode/docs/implement/pino-file-logging.md`

## Verification Run

- `npm run lint`: passed with existing warnings in generated coverage files about unused eslint-disable directives.
- `npm run build`: passed.
- `npm run test -- tests/logger.test.ts`: passed. The test verifies file creation, valid JSON Lines parsing, and redaction of password/token/authorization values.

## Manual Tests Not Run

- Manual `npm run dev` file logging smoke test was not run.
- Failed login endpoint was not manually triggered against a running dev server.
- Sensitive-value inspection of `logs/app.jsonl` from endpoint traffic was not performed in this pass; focused logger redaction was covered by `tests/logger.test.ts`.

## Risks And Follow-Up

- Local file logs can grow without bound; use log rotation if file mode is used outside local/demo environments.
- File mode is not ideal for serverless, ephemeral containers, or multi-instance deployments.
- For production cloud/container deployments, prefer `LOG_DESTINATION=stdout` and centralized logging.
