import { prisma } from "./prisma.js";
import {sendUnsentEmails} from "./mail.js";
import { validateEnv } from "./validateEnv.js";

const INTERVAL = 1000 * 15; // 15 seconds

const loop = async () => {
  await sendUnsentEmails()
  console.log(`\n⏳ Waiting ${INTERVAL / 1000} seconds...\n`);
  setTimeout(() => loop(), INTERVAL);
}

async function main() {
  validateEnv();
  console.log("✅ Environment variables are valid");
  console.log("🚀 Starting mailer...\n");

  await loop();
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
