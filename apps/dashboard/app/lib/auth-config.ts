import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Default credentials for development — override via env vars in production
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@fishlinic.local";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "fishlinic2026";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Simple credential check — replace with DB lookup when user management is added
        const emailMatch = credentials.email === ADMIN_EMAIL;
        const passwordMatch = credentials.password === ADMIN_PASSWORD;

        if (emailMatch && passwordMatch) {
          return {
            id: "1",
            name: "Admin",
            email: ADMIN_EMAIL,
            role: "admin",
          };
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
  pages: {
    signIn: "/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET || "fishlinic-dev-secret-change-in-prod",
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as { role?: string }).role;
      return token;
    },
    async session({ session, token }) {
      if (session.user) (session.user as { role?: string }).role = token.role as string;
      return session;
    },
  },
};
