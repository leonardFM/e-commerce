# Pino File Logging Tasks

Source plan: `.opencode/docs/plan/pino-file-logging-plan.md`

## Logger Destination

- [x] Update `lib/logger.ts` to support optional `LOG_DESTINATION` and `LOG_FILE_PATH` environment variables.
- [x] Preserve existing Pino behavior for `LOG_LEVEL`, development `debug` default, non-development `info` default, redaction paths, and `logHash(value)`.
- [x] When `LOG_DESTINATION=file`, write JSON Lines logs to `LOG_FILE_PATH` with default `logs/app.jsonl`.
- [x] Ensure the log file parent directory is created automatically before/when Pino destination is initialized.
- [x] Ensure Pino application logs do not go to stdout/stderr when file logging mode is active.
- [x] Keep default stdout logging when `LOG_DESTINATION` is not `file`.

## Environment And Repository Hygiene

- [x] Update `.env.example` with `LOG_DESTINATION="file"` and `LOG_FILE_PATH="logs/app.jsonl"` while keeping `LOG_LEVEL="info"`.
- [x] Update `.gitignore` to ignore `logs/` and `*.jsonl` so local JSON Lines log files are not committed.

## Documentation Workflow

- [x] Update `AGENTS.md` with logging workflow/env guidance: supported `LOG_DESTINATION` values at minimum `stdout` and `file`, `LOG_FILE_PATH` default, `logs/` files must not be committed, and stdout remains recommended for production cloud/container deployments.
- [x] After implementation, create `.opencode/docs/implement/pino-file-logging.md` with summary, changed files, verification run, manual tests not run, and risks/follow-up.

## Verification

- [x] Run `npm run lint`.
- [x] Run `npm run build`.
- [x] Run focused logger file destination test.
- [ ] Manually run file logging mode: `LOG_DESTINATION=file LOG_FILE_PATH=logs/app.jsonl LOG_LEVEL=debug npm run dev`.
- [ ] Trigger a failed login via `POST /api/auth/login` and verify `logs/app.jsonl` is created automatically.
- [ ] Confirm login failure event such as `auth_login_failed` appears in the JSON Lines file.
- [ ] Confirm sensitive values do not appear in the log file: password, token, raw email, raw Redis/cache keys.
- [ ] Confirm only hashed fields such as `emailHash`, `keyHash`, or `prefixHash` appear where applicable.
- [ ] Confirm Pino application logs do not appear in the server terminal when `LOG_DESTINATION=file`.

## Risks And Follow-Up Notes

- [x] Document that local file logs can grow without bound and production needs rotation if file mode is used.
- [x] Document that file mode is not ideal for serverless, ephemeral containers, or multi-instance deployments.

## Verification Notes

- Automated verification completed: `npm run lint` passed with existing coverage warnings, `npm run build` passed, and `npm run test -- tests/logger.test.ts` passed.
- Manual dev-server/file endpoint verification was not run because no long-running dev server and HTTP smoke-test session was started in this pass.
- A focused unit test verified file creation, JSONL parseability, and redaction for password/token/authorization values. Endpoint-level dev-server smoke tests were not run.
