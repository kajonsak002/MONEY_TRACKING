# Operations and recovery

## Automated encrypted database backups

The GitHub Actions workflow `.github/workflows/backup.yml` runs daily at 00:15 Asia/Bangkok and can also be started manually. It creates a PostgreSQL custom-format dump, encrypts it with AES-256-CBC + PBKDF2, uploads it to Cloudflare R2, and verifies the uploaded object.

Before enabling it, create a private R2 bucket and configure these GitHub Actions repository secrets. Then set the repository Actions variable `BACKUP_ENABLED` to `true` to activate the daily schedule:

- `SUPABASE_DB_URL`: PostgreSQL connection string for the MONEY_TRACKING Supabase project. Prefer the Session Pooler connection (port 5432) if the direct database host is IPv6-only; do not use Transaction Pooler for `pg_dump`. Use the database password from Supabase Connect settings; never commit it.
- `BACKUP_PASSPHRASE`: a long random passphrase stored separately from the backup bucket.
- `R2_ACCOUNT_ID`: Cloudflare account ID.
- `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY`: R2 API token credentials with Object Read & Write for the backup bucket only.
- `R2_BUCKET`: existing private R2 bucket name.

Create a private R2 bucket dedicated to this application. Configure a lifecycle expiration rule of 30–90 days according to retention needs. Do not enable public access or publish the bucket domain.

## Restore drill

Restore only into a separate disposable Supabase project/database, never over production during a drill:

1. Download the encrypted dump and checksum file from R2.
2. Verify with `sha256sum -c money-tracking.dump.gpg.sha256`.
3. Decrypt with the separately stored passphrase: `gpg --batch --yes --pinentry-mode loopback --passphrase "$BACKUP_PASSPHRASE" --output money-tracking.dump --decrypt money-tracking.dump.gpg`.
4. Restore into an isolated database using `pg_restore --no-owner --no-acl --clean --if-exists --dbname="$RESTORE_DATABASE_URL" money-tracking.dump`.
5. Verify tables, row counts, RLS policies, functions, triggers, and a test login. Record the drill date and duration.

The workflow is not operational until all repository secrets are configured and a manual run completes successfully. A restore drill is required before calling recovery verified.

## Monitoring

- Review GitHub Actions CI and Database Backup runs.
- Review Supabase Edge Function logs for `parse-entry`, `admin-settings`, and `admin-users`.
- Review Supabase security/performance advisors after migrations.
- Never log API keys, Authorization headers, or financial record contents.
