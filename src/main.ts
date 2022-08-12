import { prisma } from "./prisma.js";
import {sendUnsentEmails} from "./mail.js";
import { validateEnv } from "./validateEnv.js";
import { telegram } from "./telegram.js";

// respond to pings, to know if the bot is alive
telegram.on('message', (msg) => {
  const chatId = msg.chat.id;

  const text = msg.text;
  if (text?.toLowerCase() === "ping") {
    console.log("🏓 Pong!");
    telegram.sendMessage(chatId, "🏓 Pong!");
  }
});

/* Catch errors that are not caught by the try/catch blocks. */
process.on('uncaughtException', function (e) {
  console.error(e.stack);
  telegram.sendMessage(process.env.TELEGRAM_CHAT_ID!, JSON.stringify(e));

  // exit
  process.exit(1);
});

const INTERVAL = 1000 * 15; // 15 seconds

const loop = async () => {
  try{
    await sendUnsentEmails()
  } catch (e) {
    console.error(e);
    telegram.sendMessage(process.env.TELEGRAM_CHAT_ID!, JSON.stringify(e));
  }
  console.log(`\n⏳ Waiting ${INTERVAL / 1000} seconds...\n`);
  setTimeout(() => loop(), INTERVAL);
}

async function main() {
  validateEnv();
  console.log("✅ Environment variables are valid");
  console.log("🚀 Starting mailer...\n");

  telegram.sendMessage(process.env.TELEGRAM_CHAT_ID!, "🚀 Starting mailer...");

  try{
    await loop();
  } catch (e) {
    console.error(e);
    telegram.sendMessage(process.env.TELEGRAM_CHAT_ID!, JSON.stringify(e));
  }
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
