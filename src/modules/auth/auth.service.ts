import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { emailService } from "@/services/email.service";
import { AppError } from "@/modules/shared/errors";
import { authRepository } from "./auth.repository";
import { db } from "@/lib/db";
import type { RegisterDTO, LoginDTO, LoginResult, AuthUser } from "./auth.types";

const VERIFICATION_TOKEN_MINUTES = 60 * 24;
const RESET_TOKEN_MINUTES = 15;
const REMEMBER_ME_DAYS = 30;
const STANDARD_SESSION_DAYS = 1;

function signToken(user: { id: string; name: string | null; email: string; role: Role; avatar: string | null; emailVerified: Date | null }, rememberMe: boolean): LoginResult {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new AppError("JWT secret is not configured", 500, "JWT_SECRET_MISSING");
  }

  const expiresInSeconds =
    (rememberMe ? REMEMBER_ME_DAYS : STANDARD_SESSION_DAYS) * 24 * 60 * 60;

  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    secret,
    { algorithm: "HS256", expiresIn: expiresInSeconds }
  );

  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

  return { token, expiresAt, user: publicUser(user) };
}

function createSecureToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function publicUser(user: {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  avatar: string | null;
  emailVerified: Date | null;
}): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    emailVerified: user.emailVerified,
  };
}

export const authService = {
  async login(data: LoginDTO): Promise<LoginResult> {
    const user = await authRepository.findByEmail(data.email);
    if (!user?.password) {
      throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    const isValid = await bcrypt.compare(data.password, user.password);
    if (!isValid) {
      throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }
    if (!user.emailVerified) {
      throw new AppError("Email is not verified", 403, "EMAIL_NOT_VERIFIED");
    }
    if (user.deletedAt) {
      throw new AppError("Account has been deleted", 403, "ACCOUNT_DELETED");
    }
    if (user.isRestricted) {
      throw new AppError("Account is restricted", 403, "ACCOUNT_RESTRICTED");
    }

    return signToken(user, data.rememberMe ?? false);
  },

  async register(data: RegisterDTO): Promise<AuthUser> {
    const existing = await authRepository.findByEmail(data.email);
    if (existing) {
      throw new AppError("Email already in use", 409, "EMAIL_IN_USE");
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const verificationToken = createSecureToken();
    const verificationTokenHash = hashToken(verificationToken);
    const verificationExpiry = addMinutes(new Date(), VERIFICATION_TOKEN_MINUTES);

    const user = await authRepository.createUser({
      ...data,
      hashedPassword,
      verificationToken: verificationTokenHash,
      verificationExpiry,
    });

    if (data.role === "SELLER" && data.shopName) {
      await db.sellerProfile.create({
        data: {
          userId: user.id,
          shopName: data.shopName,
          isApproved: true, // Auto-approve for now
        },
      });
    }

    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    await emailService.sendVerificationEmail({
      to: user.email,
      name: user.name,
      verificationUrl: `${baseUrl}/verify-email?token=${verificationToken}`,
    });

    return publicUser(user);
  },

  async verifyEmail(token: string) {
    const result = await authRepository.verifyEmail(hashToken(token));
    if (result.count === 0) {
      throw new AppError("Invalid or expired verification link", 400, "INVALID_VERIFICATION_TOKEN");
    }
    return { verified: true };
  },

  async requestPasswordReset(email: string) {
    const user = await authRepository.findByEmail(email);
    if (!user) return { sent: true };

    const resetToken = createSecureToken();
    const resetTokenHash = hashToken(resetToken);
    await authRepository.setPasswordResetToken(
      user.email,
      resetTokenHash,
      addMinutes(new Date(), RESET_TOKEN_MINUTES)
    );

    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    await emailService.sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl: `${baseUrl}/reset-password?token=${resetToken}`,
    });

    return { sent: true };
  },

  async resetPassword(token: string, password: string) {
    const user = await authRepository.findByResetToken(hashToken(token));
    if (!user) {
      throw new AppError("Invalid or expired reset link", 400, "INVALID_RESET_TOKEN");
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await authRepository.updatePassword(user.id, hashedPassword);
    return { reset: true };
  },

  async resendVerificationEmail(email: string) {
    const user = await authRepository.findByEmail(email);
    if (!user) {
      throw new AppError("No account found with this email", 404, "USER_NOT_FOUND");
    }
    if (user.emailVerified) {
      throw new AppError("Email is already verified", 400, "EMAIL_ALREADY_VERIFIED");
    }

    const verificationToken = createSecureToken();
    const verificationTokenHash = hashToken(verificationToken);
    const verificationExpiry = addMinutes(new Date(), VERIFICATION_TOKEN_MINUTES);

    await authRepository.updateVerificationToken(user.id, verificationTokenHash, verificationExpiry);

    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    await emailService.sendVerificationEmail({
      to: user.email,
      name: user.name,
      verificationUrl: `${baseUrl}/verify-email?token=${verificationToken}`,
    });

    return { sent: true };
  },

  async findById(id: string): Promise<AuthUser | null> {
    const user = await authRepository.findById(id);
    if (!user) return null;
    return publicUser(user);
  },
};
