# Pino File Logging Plan

## Goal

Ubah konfigurasi logger Pino agar log aplikasi dapat disimpan ke folder `logs/` sebagai file JSON Lines, dan tidak lagi wajib tampil di stdout/server console untuk kebutuhan demo/interview.

## Interpretation

Permintaan "simpan log di folder logs dan hilangkan yang ada di server" ditafsirkan sebagai:

- Log aplikasi ditulis ke file lokal di folder `logs/`.
- Output log Pino aplikasi tidak dikirim ke stdout/stderr ketika mode file aktif.
- File log tidak boleh dicommit ke repository.

## Current State

- Logger utama ada di `lib/logger.ts` dan menggunakan Pino.
- Logger saat ini menulis ke stdout default Pino.
- `LOG_LEVEL` sudah tersedia di `.env.example`.
- `.gitignore` saat ini mengabaikan `.next`, `node_modules`, `*.log`, dan `.env`.
- Redaction dan `logHash()` sudah tersedia untuk mencegah password, token, authorization header, payment reference, email mentah, dan key mentah masuk log.

## Design

Gunakan Pino destination berbasis file saat `LOG_DESTINATION=file`.

Default yang direkomendasikan untuk kebutuhan tugas ini:

```env
LOG_DESTINATION="file"
LOG_FILE_PATH="logs/app.jsonl"
```

Format file menggunakan JSON Lines:

```txt
logs/app.jsonl
```

Alasan memakai `.jsonl`:

- Pino menulis satu object JSON per baris.
- File streaming log bukan satu JSON array valid.
- `.jsonl` lebih tepat daripada `log.json` untuk structured streaming logs.

## Implementation Steps

### 1. Update Logger Destination

Update `lib/logger.ts`.

Requirements:

- Tetap gunakan konfigurasi Pino yang sudah ada:
  - `LOG_LEVEL`
  - default `debug` saat development
  - default `info` selain development
  - redaction paths yang sudah ada
  - `logHash(value)` helper
- Tambahkan env opsional:
  - `LOG_DESTINATION`
  - `LOG_FILE_PATH`
- Jika `LOG_DESTINATION=file`:
  - Tulis log ke `LOG_FILE_PATH`.
  - Default path `logs/app.jsonl`.
  - Buat folder parent otomatis jika belum ada.
  - Jangan output Pino app logs ke stdout/stderr.
- Jika `LOG_DESTINATION` bukan `file`:
  - Tetap gunakan stdout default Pino.

Contoh target behavior:

```ts
const logDestination = process.env.LOG_DESTINATION ?? 'stdout'
const logFilePath = process.env.LOG_FILE_PATH ?? 'logs/app.jsonl'

export const logger = logDestination === 'file'
  ? pino(loggerOptions, pino.destination({ dest: logFilePath, sync: false, mkdir: true }))
  : pino(loggerOptions)
```

Catatan:

- Jika versi Pino yang dipakai tidak mendukung `mkdir`, gunakan `mkdirSync(dirname(logFilePath), { recursive: true })` sebelum membuat destination.
- Hindari menulis file manual dengan `fs.appendFile` karena Pino destination sudah menangani stream.

### 2. Update Environment Example

Update `.env.example`.

Tambahkan:

```env
LOG_DESTINATION="file"
LOG_FILE_PATH="logs/app.jsonl"
```

Pertahankan:

```env
LOG_LEVEL="info"
```

### 3. Update Git Ignore

Update `.gitignore` agar file log tidak masuk repository.

Tambahkan:

```gitignore
logs/
*.jsonl
```

Catatan:

- `*.log` sudah ada, tapi tidak mencakup `.jsonl`.
- `logs/` perlu di-ignore agar semua file log lokal tetap aman.

### 4. Update AGENTS.md

Update dokumentasi workflow logging.

Tambahkan informasi:

- `LOG_DESTINATION` opsional, nilai yang didukung minimal `stdout` dan `file`.
- `LOG_FILE_PATH` opsional, default `logs/app.jsonl` saat file logging aktif.
- File dalam `logs/` tidak boleh dicommit.
- Untuk production cloud/container, stdout tetap lebih direkomendasikan; mode file dipakai untuk kebutuhan demo/interview atau VPS single instance.

### 5. Create Or Update Task File

Setelah plan disetujui, buat task file:

```txt
.opencode/docs/task/pino-file-logging.md
```

Task minimal:

- Update `lib/logger.ts`.
- Update `.env.example`.
- Update `.gitignore`.
- Update `AGENTS.md`.
- Jalankan lint/build.
- Buat implementation note.

### 6. Add Implementation Note

Setelah implementasi, buat atau update:

```txt
.opencode/docs/implement/pino-file-logging.md
```

Isi minimal:

- Ringkasan perubahan.
- File yang diubah.
- Verifikasi yang dijalankan.
- Manual test yang belum dijalankan.
- Risiko/follow-up.

## Verification

### Automated Verification

Jalankan:

```bash
npm run lint
npm run build
```

### Manual Verification

Jalankan app dengan mode file logging:

```bash
LOG_DESTINATION=file LOG_FILE_PATH=logs/app.jsonl LOG_LEVEL=debug npm run dev
```

Trigger endpoint login gagal:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@solutech.test","password":"wrong-password"}'
```

Cek file log:

```bash
logs/app.jsonl
```

Pastikan:

- File `logs/app.jsonl` dibuat otomatis.
- Event seperti `auth_login_failed` muncul di file.
- Password tidak muncul di file log.
- Token tidak muncul di file log.
- Email mentah tidak muncul; yang muncul hanya `emailHash`.
- Key Redis/cache mentah tidak muncul; yang muncul hanya `keyHash` atau `prefixHash`.
- Saat `LOG_DESTINATION=file`, log Pino aplikasi tidak tampil di terminal server.

## Risks And Follow-Up

- File log bisa membesar tanpa batas; production perlu log rotation.
- Mode file tidak ideal untuk serverless, container ephemeral, atau multi-instance deployment.
- Untuk production cloud/container, stdout JSON tetap lebih direkomendasikan agar platform logging bisa mengumpulkan log.
- Jika butuh log rotation lokal, follow-up bisa memakai `pino-roll`, `rotating-file-stream`, PM2, systemd, atau logrotate.
- Jika butuh centralized observability, follow-up bisa integrasi Loki/Grafana, ELK/OpenSearch, Datadog, CloudWatch, atau Sentry.
