import { createAuthClient } from "better-auth/react";
import type { auth } from "./auth.ts";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [inferAdditionalFields<typeof auth>(), adminClient()],
});
