#!/bin/bash
set -e

# Mercury Least-Privilege Database Roles Provisioning (SEC-12)
# Dynamically creates or updates roles using environment variables

APP_USER="${APP_DB_USER:-mercury_app}"
APP_PASS="${APP_DB_PASSWORD:-mercury_app_secret}"
ML_USER="${ML_DB_USER:-mercury_ml}"
ML_PASS="${ML_DB_PASSWORD:-mercury_ml_secret}"
DB_NAME="${POSTGRES_DB:-mercury_db}"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$DB_NAME" <<-EOSQL
    -- 1. Create or update Application Gateway Role (mercury_app)
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$APP_USER') THEN
            CREATE ROLE $APP_USER WITH LOGIN PASSWORD '$APP_PASS';
        ELSE
            ALTER ROLE $APP_USER WITH PASSWORD '$APP_PASS';
        END IF;
    END
    \$\$;

    GRANT USAGE, CREATE ON SCHEMA public TO $APP_USER;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO $APP_USER;
    GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO $APP_USER;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO $APP_USER;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO $APP_USER;

    -- Transfer table and sequence ownership to $APP_USER so subsequent migrations and indexes can be applied
    DO \$\$
    DECLARE
        tbl text;
    BEGIN
        FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
            EXECUTE format('ALTER TABLE public.%I OWNER TO %I', tbl, '$APP_USER');
        END LOOP;
        FOR tbl IN SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public' LOOP
            EXECUTE format('ALTER SEQUENCE public.%I OWNER TO %I', tbl, '$APP_USER');
        END LOOP;
    END
    \$\$;

    -- 2. Create or update ML Forecasting Engine Role (mercury_ml)
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$ML_USER') THEN
            CREATE ROLE $ML_USER WITH LOGIN PASSWORD '$ML_PASS';
        ELSE
            ALTER ROLE $ML_USER WITH PASSWORD '$ML_PASS';
        END IF;
    END
    \$\$;

    GRANT USAGE ON SCHEMA public TO $ML_USER;
    GRANT SELECT ON products, inventory, orders, competitor_events TO $ML_USER;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO $ML_USER;

    REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA public FROM $ML_USER;
EOSQL
