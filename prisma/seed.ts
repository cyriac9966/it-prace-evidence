import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPass = "Admin123456";
  const userPass = "User123456";

  const adminHash = await bcrypt.hash(adminPass, 12);
  const userHash = await bcrypt.hash(userPass, 12);

  await prisma.user.upsert({
    where: { email: "admin@local.dev" },
    update: {
      passwordHash: adminHash,
      name: "Administrátor",
      role: Role.ADMIN,
      username: "admin",
    },
    create: {
      email: "admin@local.dev",
      username: "admin",
      passwordHash: adminHash,
      name: "Administrátor",
      role: Role.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: "user@local.dev" },
    update: { passwordHash: userHash, name: "Technik", username: "technik" },
    create: {
      email: "user@local.dev",
      username: "technik",
      passwordHash: userHash,
      name: "Technik",
      role: Role.USER,
    },
  });

  console.log("Seed dokončen.");
  console.log("  Admin: e-mail admin@local.dev nebo jméno admin · heslo " + adminPass);
  console.log("  Uživatel: e-mail user@local.dev nebo jméno technik · heslo " + userPass);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    void prisma.$disconnect();
    process.exit(1);
  });
