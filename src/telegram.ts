import TelegramBot from "node-telegram-bot-api";

export const telegram = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, {polling: true});
