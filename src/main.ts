import { prisma } from "./prisma.js";
import {sendUnsentEmails} from "./mail.js";
import { validateEnv } from "./validateEnv.js";

const INTERVAL = 1000 * 15; // 15 seconds

async function main() {
  validateEnv();

  setInterval(async () => {
    await sendUnsentEmails();
    console.log(`Waiting ${INTERVAL / 1000} seconds...`);
  }, INTERVAL);
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
