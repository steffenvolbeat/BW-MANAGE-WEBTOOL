-- Initial setup script for PostgreSQL
-- This script runs when the PostgreSQL container starts for the first time

-- Create additional extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create indexes for better performance (will be added after Prisma migration)
-- These are commented out as Prisma will handle the schema creation

-- Example of what will be created by Prisma:
/*
-- Indexes for frequently searched columns
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON "Application"("userId");
CREATE INDEX IF NOT EXISTS idx_applications_status ON "Application"("status");
CREATE INDEX IF NOT EXISTS idx_applications_company_name ON "Application"("companyName");

CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON "Contact"("userId");
CREATE INDEX IF NOT EXISTS idx_contacts_name ON "Contact"("firstName", "lastName");

CREATE INDEX IF NOT EXISTS idx_activities_user_id ON "Activity"("userId");
CREATE INDEX IF NOT EXISTS idx_activities_due_date ON "Activity"("dueDate");
CREATE INDEX IF NOT EXISTS idx_activities_status ON "Activity"("status");

CREATE INDEX IF NOT EXISTS idx_events_user_id ON "Event"("userId");
CREATE INDEX IF NOT EXISTS idx_events_start_time ON "Event"("startTime");

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON "Document"("userId");
CREATE INDEX IF NOT EXISTS idx_documents_application_id ON "Document"("applicationId");
*/

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'Bewerbungs-Management-Tool database initialized successfully!';
END $$;