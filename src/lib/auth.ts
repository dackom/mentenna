import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { Resend } from "resend";

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 3,
    sendResetPassword: async ({ user, url }) => {
      await resend.emails.send({
        from: "Reset Password <onboarding@loudvibe.com>",
        to: user.email,
        subject: "Reset your password",
        html: `Click the link to reset your password: ${url}`,
      });
    },
  },
  plugins: [nextCookies(), admin()],
  user: {
    additionalFields: {
      phone: {
        type: "string",
        input: true,
      },
    },
    deleteUser: {
      enabled: true,
    },
  },
});
