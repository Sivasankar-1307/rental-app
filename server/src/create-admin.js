const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@test.com";
  const adminPassword = "admin123";

  console.log(`Checking if admin user "${adminEmail}" exists...`);
  const existing = await prisma.users.findUnique({
    where: { username: adminEmail }
  });

  if (existing) {
    console.log(`Admin user "${adminEmail}" already exists!`);
    return;
  }

  console.log("Creating admin user...");
  const admin = await prisma.users.create({
    data: {
      username: adminEmail,
      password: adminPassword,
      role: "ADMIN",
      is_active: true,
      name: "System Admin"
    }
  });

  console.log("Admin user created successfully:", admin);
}

main()
  .catch((e) => {
    console.error("Error creating admin user:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
