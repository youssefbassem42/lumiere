import { NextAuthOptions } from "next-auth";
import type { Provider } from "next-auth/providers/index";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";

const rememberMeDays = 30;
const standardSessionDays = 1;

const providers: Provider[] = [
  CredentialsProvider({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
      rememberMe: { label: "Remember Me", type: "text" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;

      const user = await db.user.findUnique({
        where: { email: credentials.email },
      });

      if (!user?.password) return null;

      const isValid = await bcrypt.compare(
        credentials.password,
        user.password
      );

      if (!isValid) return null;
      if (!user.emailVerified) throw new Error("EMAIL_NOT_VERIFIED");
      if (user.deletedAt) throw new Error("ACCOUNT_DELETED");
      if (user.isRestricted) throw new Error("ACCOUNT_RESTRICTED");

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        image: user.avatar,
        rememberMe: credentials.rememberMe === "true",
      };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    })
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as NextAuthOptions["adapter"],
  session: { strategy: "jwt", maxAge: rememberMeDays * 24 * 60 * 60 },
  jwt: { maxAge: rememberMeDays * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers,
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role || "USER";
        token.rememberMe = Boolean((user as { rememberMe?: boolean }).rememberMe);
        token.exp = Math.floor(Date.now() / 1000) +
          (token.rememberMe ? rememberMeDays : standardSessionDays) * 24 * 60 * 60;
      }

      if (token.email) {
        try {
          const dbUser = await db.user.findUnique({ 
            where: { email: token.email as string },
            select: { id: true, role: true, isRestricted: true, deletedAt: true }
          });
          
          if (!dbUser || dbUser.deletedAt || dbUser.isRestricted) {
            return {}; // Effectively invalidates the token
          }
          
          token.id = dbUser.id;
          token.role = dbUser.role || "USER";
        } catch (error) {
          // If DB check fails, we fallback to existing token to avoid blocking the user
          // but we log it for debugging
          console.error("JWT Refresh Error:", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
};

import { getServerSession } from "next-auth";

export async function getSession() {
  return await getServerSession(authOptions);
}

export interface ApiSessionUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export interface ApiSession {
  user: ApiSessionUser;
}

export async function getRequestSession(request: NextRequest): Promise<ApiSession | null> {
  const cookieSession = await getServerSession(authOptions);
  if (cookieSession?.user?.id) {
    return {
      user: {
        id: cookieSession.user.id as string,
        email: cookieSession.user.email as string,
        name: cookieSession.user.name ?? null,
        role: (cookieSession.user as { role?: string }).role ?? "USER",
      },
    };
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return null;

  let payload: jwt.JwtPayload;
  try {
    payload = jwt.verify(authHeader.slice("Bearer ".length), secret, {
      algorithms: ["HS256"],
    }) as jwt.JwtPayload;
  } catch {
    return null;
  }

  if (!payload.sub || typeof payload.sub !== "string") return null;

  const dbUser = await db.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, name: true, role: true, isRestricted: true, deletedAt: true },
  });
  if (!dbUser || dbUser.deletedAt || dbUser.isRestricted) return null;

  return {
    user: {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
    },
  };
}

export async function isAuthenticated() {
  const session = await getSession();
  return !!session?.user;
}

export async function isAdmin() {
  const session = await getSession();
  return session?.user?.role === "ADMIN";
}

export async function isSeller() {
  const session = await getSession();
  return session?.user?.role === "SELLER";
}
