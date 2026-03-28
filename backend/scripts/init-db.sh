#!/bin/bash
set -e

DB_CMD="psql -U $POSTGRES_USER -d $POSTGRES_DB"

# ── Ensure Alembic stamp (always, idempotent) ─────────────
# The dump already contains the full schema, so we mark Alembic
# as up-to-date to prevent migrations from trying to re-create tables.
stamp_alembic() {
  $DB_CMD -v ON_ERROR_STOP=1 -c \
    "INSERT INTO alembic_version (version_num) VALUES ('0003')
     ON CONFLICT (version_num) DO NOTHING;"
}

# ── Idempotency check ─────────────────────────────────────
# If the schema already exists (e.g. persistent volume), just
# ensure alembic is stamped and exit.
ALREADY_INIT=$($DB_CMD -tAc \
  "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='empresas' LIMIT 1;" 2>/dev/null || echo "")

if [ "$ALREADY_INIT" = "1" ]; then
  echo "==> Schema already exists, ensuring alembic stamp..."
  stamp_alembic
  echo "==> Done."
  exit 0
fi

# ── Create roles referenced by the Supabase dump ──────────
# These roles don't exist in vanilla PostgreSQL but the dump
# contains GRANT statements for them. We create them as NOLOGIN
# so the GRANTs succeed silently.
for role in anon authenticated service_role saluadmin; do
  $DB_CMD -v ON_ERROR_STOP=0 -c \
    "DO \$\$ BEGIN
       IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${role}') THEN
         CREATE ROLE ${role} NOLOGIN;
       END IF;
     END \$\$;"
done

# ── Load the schema dump ──────────────────────────────────
# ON_ERROR_STOP=0 so non-critical errors (duplicate indexes, etc.)
# don't abort the entire import.
$DB_CMD -v ON_ERROR_STOP=0 -f /docker-entrypoint-initdb.d/basedb.sql.data

# ── Stamp Alembic at the latest revision ──────────────────
stamp_alembic

echo "==> Database initialized successfully."
