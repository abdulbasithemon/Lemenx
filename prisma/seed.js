/* Seeds the default super admin and the four default lead statuses. */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: "admin@lemenx.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@lemenx.com",
      dob: "1990-01-01",
      passwordHash: bcrypt.hashSync("admin123", 10),
      role: "super_admin",
      status: "active",
    },
  });

  const defaults = [
    { label: "Done", color: "#16a34a" },
    { label: "Cancel", color: "#dc2626" },
    { label: "Phone Off", color: "#d97706" },
    { label: "No Response", color: "#64748b" },
  ];
  for (const s of defaults) {
    await prisma.status.upsert({
      where: { label: s.label },
      update: {},
      create: { ...s, isDefault: true, createdBy: admin.id },
    });
  }

  console.log("Seed complete.");
  console.log("Super Admin login -> email: admin@lemenx.com | DOB: 1990-01-01 | password: admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
