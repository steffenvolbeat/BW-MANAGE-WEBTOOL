const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const p = new PrismaClient({ adapter });

async function main() {
  // 1. ViewAccessGrants
  const grants = await p.viewAccessGrant.findMany({
    include: {
      grantee: { select: { email: true, role: true } },
      target: { select: { email: true, role: true } },
    },
  });
  console.log("\n=== ViewAccessGrants ===");
  if (grants.length === 0) {
    console.log("KEINE Grants vorhanden!");
  } else {
    for (const g of grants) {
      console.log(`Grantee: ${g.grantee.email} (${g.grantee.role}) -> Target: ${g.target.email} (${g.target.role})`);
    }
  }

  // 2. Alle User-Rollen
  const users = await p.user.findMany({
    select: { id: true, email: true, role: true, status: true },
  });
  console.log("\n=== Alle User ===");
  for (const u of users) {
    console.log(`${u.email} | ${u.role} | ${u.status} | id=${u.id}`);
  }

  // 3. Bewerbungen count pro User
  const apps = await p.application.groupBy({
    by: ["userId"],
    _count: true,
  });
  console.log("\n=== Bewerbungen pro UserId ===");
  for (const a of apps) {
    console.log(`userId=${a.userId}: ${a._count} Bewerbungen`);
  }
}

main().catch(console.error).finally(() => p.$disconnect());
