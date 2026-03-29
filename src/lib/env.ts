import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    DATABASE_URL: z.string().url().optional(),
    TEST_DATABASE_URL: z.string().url().optional(),
    NEXTAUTH_SECRET: z.string().min(1).default("dev-nextauth-secret-change-me"),
    NEXTAUTH_URL: z.string().url().default("http://localhost:3000"),
    STUDIO_OWNER_EMAIL: z.string().email().default("owner@example.com"),
    STUDIO_OWNER_PASSWORD: z.string().min(8).default("dev-password"),
    SENTRY_DSN: z.union([z.string().url(), z.literal("")]).optional(),
    RESEND_API_KEY: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.NODE_ENV === "production" && !value.DATABASE_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["DATABASE_URL"],
        message: "DATABASE_URL is required when NODE_ENV=production",
      });
    }

    if (value.NODE_ENV === "test" && !value.TEST_DATABASE_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["TEST_DATABASE_URL"],
        message: "TEST_DATABASE_URL is required when NODE_ENV=test",
      });
    }

    if (
      value.NODE_ENV === "production" &&
      value.NEXTAUTH_SECRET === "dev-nextauth-secret-change-me"
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["NEXTAUTH_SECRET"],
        message:
          "NEXTAUTH_SECRET must be set to a strong secret in production",
      });
    }

    if (
      value.NODE_ENV === "production" &&
      value.NEXTAUTH_URL === "http://localhost:3000"
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["NEXTAUTH_URL"],
        message: "NEXTAUTH_URL must be set to the production URL",
      });
    }

    if (
      value.NODE_ENV === "production" &&
      value.STUDIO_OWNER_EMAIL === "owner@example.com"
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["STUDIO_OWNER_EMAIL"],
        message: "STUDIO_OWNER_EMAIL must be set in production",
      });
    }

    if (
      value.NODE_ENV === "production" &&
      value.STUDIO_OWNER_PASSWORD === "dev-password"
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["STUDIO_OWNER_PASSWORD"],
        message: "STUDIO_OWNER_PASSWORD must be changed from the default in production",
      });
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(
    `Invalid environment configuration:\n${JSON.stringify(parsed.error.flatten().fieldErrors, null, 2)}`,
  );
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
