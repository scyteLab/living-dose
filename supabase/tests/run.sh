#!/bin/bash
# Tests every migration and the security rules (orders, bookings, community,
# professionals, organisations) on a local PostgreSQL.
# Needs PostgreSQL 15+ installed (psql and createdb on your PATH) and a local server running.
#   bash supabase/tests/run.sh
# Uses a throwaway database called living_dose_test; nothing touches Supabase.
set -e
cd "$(dirname "$0")/.."
DB=living_dose_test
dropdb --if-exists $DB 2>/dev/null; createdb $DB
P="psql -d $DB -v ON_ERROR_STOP=1 -q"
$P -f tests/supabase_stub.sql >/dev/null
for f in migrations/*.sql; do $P -f "$f" >/dev/null && echo "OK    $f"; done
for s in products sample_professionals sample_organisations; do $P -f seed/$s.sql >/dev/null; done && echo "OK    seed data"
for t in tests/0009_security.test.sql tests/0010_security.test.sql tests/0011_security.test.sql; do
  psql -d $DB -q -f $t 2>&1 | grep -E "ok |FAIL|ERROR" | sed 's/^ *//'
done | tee /tmp/ld_results.txt
echo; echo "$(grep -c '^ok' /tmp/ld_results.txt) passed, $(grep -c 'FAIL\|ERROR' /tmp/ld_results.txt) failed"
dropdb $DB
