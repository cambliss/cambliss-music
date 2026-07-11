const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("Admin1234!", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@cambliss.studio" },
    update: {},
    create: {
      email: "admin@cambliss.studio",
      name: "Cambliss Admin",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });

  const artistPassword = await bcrypt.hash("Artist1234!", 10);
  const artist = await prisma.user.upsert({
    where: { email: "artist@cambliss.studio" },
    update: {},
    create: {
      email: "artist@cambliss.studio",
      name: "Nova Reyes",
      passwordHash: artistPassword,
      role: "ARTIST",
      artistProfile: {
        create: {
          bio: "Bedroom pop producer from Austin, TX.",
          links: { instagram: "https://instagram.com/novareyes" },
        },
      },
    },
  });

  console.log("Seeded:", { admin: admin.email, artist: artist.email });
  console.log("Admin login: admin@cambliss.studio / Admin1234!");
  console.log("Artist login: artist@cambliss.studio / Artist1234!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
