import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Next.js keeps secrets in .env.local; load it (then .env) for the Prisma CLI too.
config({ path: ".env.local", quiet: true });
config({ quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Migrations need a direct (non-pooled) connection; Supabase's pooler on 6543 can't run them.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
});
