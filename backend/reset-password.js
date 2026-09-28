const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  
  if (users.length === 0) {
    console.log("No users found in the database. Please register a new account.");
    return;
  }

  const newPassword = "password123";
  const password_hash = await bcrypt.hash(newPassword, 10);

  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: { password_hash }
    });
    console.log(`Password reset for user: ${user.email}`);
  }

  console.log(`\nSuccess! All passwords have been reset to: ${newPassword}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
