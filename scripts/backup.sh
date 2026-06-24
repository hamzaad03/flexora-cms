#!/usr/bin/env bash
# FlxOraCMS backup: dumps the MySQL database and archives the storage directory.
# Requires: mysqldump, tar. Reads DATABASE_URL + STORAGE_DIR from the environment
# (source your .env first, e.g. `set -a; . ./.env; set +a`).
set -euo pipefail

: "${DATABASE_URL:?Set DATABASE_URL}"
STORAGE_DIR="${STORAGE_DIR:-./storage}"
OUT_DIR="${1:-./backups}"
TS="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$OUT_DIR"

# Parse mysql://user:pass@host:port/db
proto_removed="${DATABASE_URL#mysql://}"
creds="${proto_removed%%@*}"
hostpart="${proto_removed#*@}"
USER="${creds%%:*}"
PASS="${creds#*:}"
HOSTPORT="${hostpart%%/*}"
DB="${hostpart#*/}"; DB="${DB%%\?*}"
HOST="${HOSTPORT%%:*}"
PORT="${HOSTPORT#*:}"; [ "$PORT" = "$HOST" ] && PORT=3306

echo "Dumping database '$DB' -> $OUT_DIR/db-$TS.sql"
MYSQL_PWD="$PASS" mysqldump --single-transaction --quick \
  -h "$HOST" -P "$PORT" -u "$USER" "$DB" > "$OUT_DIR/db-$TS.sql"

echo "Archiving '$STORAGE_DIR' -> $OUT_DIR/storage-$TS.tar.gz"
tar -czf "$OUT_DIR/storage-$TS.tar.gz" "$STORAGE_DIR"

echo "Backup complete: $OUT_DIR/db-$TS.sql, $OUT_DIR/storage-$TS.tar.gz"
