-- Mercury Least-Privilege Database Roles Provisioning (SEC-12)

-- 1. Create Application Gateway Role (mercury_app):
-- Granted CRUD access on business tables and sequence usage.
-- Denied schema altering, superuser privileges, and role creation.
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'mercury_app') THEN
        CREATE ROLE mercury_app WITH LOGIN PASSWORD 'mercury_app_secret';
    END IF;
END
$$;

GRANT USAGE, CREATE ON SCHEMA public TO mercury_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO mercury_app;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO mercury_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO mercury_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO mercury_app;

-- Transfer table and sequence ownership to mercury_app for schema migrations
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE format('ALTER TABLE public.%I OWNER TO mercury_app', tbl);
    END LOOP;
    FOR tbl IN SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public' LOOP
        EXECUTE format('ALTER SEQUENCE public.%I OWNER TO mercury_app', tbl);
    END LOOP;
END
$$;

-- 2. Create ML Forecasting Engine Role (mercury_ml):
-- Strictly read-only access to products, inventory, orders, and competitor_events.
-- Denied all mutations (INSERT, UPDATE, DELETE, TRUNCATE, DROP).
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'mercury_ml') THEN
        CREATE ROLE mercury_ml WITH LOGIN PASSWORD 'mercury_ml_secret';
    END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO mercury_ml;
GRANT SELECT ON products, inventory, orders, competitor_events TO mercury_ml;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO mercury_ml;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA public FROM mercury_ml;

