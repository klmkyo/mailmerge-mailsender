import { z } from "zod";

const formatErrors = (
  errors: import('zod').ZodFormattedError<Map<string,string>,string>,
) =>
  Object.entries(errors)
    .map(([name, value]) => {
      if (value && "_errors" in value)
        return `${name}: ${value._errors.join(", ")}\n`;
    })
    .filter(Boolean);

const serverSchema = z.object({
  DATABASE_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  DEPLOY_URL: z.string().url(),
  TELEGRAM_BOT_TOKEN: z.string(),
  TELEGRAM_CHAT_ID: z.string(),
  NODE_ENV: z.enum(["development", "production"]),
});

export const validateEnv = (): void => {
  const _serverEnv = serverSchema.safeParse(process.env);

  if (!_serverEnv.success) {
    console.error(
      "❌ Invalid environment variables:\n",
      ...formatErrors(_serverEnv.error.format()),
    );
    throw new Error("Invalid environment variables");
  }
}
