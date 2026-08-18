import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@gmail.com";
  const password = process.env.ADMIN_PASSWORD ?? "Admin@12345";
  const name = process.env.ADMIN_NAME ?? "Administrator";

  const hashedPassword = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: "ADMIN",
      deletedAt: null,
      isRestricted: false,
      emailVerified: new Date(),
    },
    create: {
      name,
      email,
      password: hashedPassword,
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });

  console.log("✅ Admin account ready:");
  console.log("----------------------------------");
  console.log(`Email:    ${admin.email}`);
  console.log(`Role:     ${admin.role}`);
  console.log(`Verified: ${admin.emailVerified ? "yes" : "no"}`);
  console.log("----------------------------------");
}

main()
  .catch((e) => {
    console.error("❌ Admin seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
