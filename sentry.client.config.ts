import * as Sentry from "@sentry/nextjs";

import { env } from "@/lib/env";

if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
  });
}
