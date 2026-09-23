-- Supabase exposes the public schema through its auto-generated REST/GraphQL API.
-- Enabling row level security with no policies blocks that API (anon and authenticated roles)
-- from every TRIPYYY table. The app connects as the table owner, which RLS does not restrict.
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Trip" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
