import TelegramBot from "node-telegram-bot-api";

// dont use polling in dev enviroment, to avoid colliding with the production bot
export const telegram = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, {polling: process.env.NODE_ENV === "production"});
