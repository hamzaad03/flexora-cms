#!/usr/bin/env bash
# FlxOraCMS restore: imports a SQL dump and extracts a storage archive.
# Usage: ./scripts/restore.sh backups/db-YYYYMMDD-HHMMSS.sql backups/storage-YYYYMMDD-HHMMSS.tar.gz
set -euo pipefail

: "${DATABASE_URL:?Set DATABASE_URL}"
SQL_FILE="${1:?Path to .sql dump}"
STORAGE_ARCHIVE="${2:-}"

proto_removed="${DATABASE_URL#mysql://}"
creds="${proto_removed%%@*}"
hostpart="${proto_removed#*@}"
USER="${creds%%:*}"
PASS="${creds#*:}"
HOSTPORT="${hostpart%%/*}"
DB="${hostpart#*/}"; DB="${DB%%\?*}"
HOST="${HOSTPORT%%:*}"
PORT="${HOSTPORT#*:}"; [ "$PORT" = "$HOST" ] && PORT=3306

echo "Restoring '$DB' from $SQL_FILE"
MYSQL_PWD="$PASS" mysql -h "$HOST" -P "$PORT" -u "$USER" "$DB" < "$SQL_FILE"

if [ -n "$STORAGE_ARCHIVE" ]; then
  echo "Extracting $STORAGE_ARCHIVE"
  tar -xzf "$STORAGE_ARCHIVE"
fi

echo "Restore complete."
