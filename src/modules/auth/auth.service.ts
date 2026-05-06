import bcrypt from "bcrypt";
import crypto from "crypto";
import { Role } from "@prisma/client";
import { emailService } from "@/services/email.service";
import { AppError } from "@/modules/shared/errors";
import { authRepository } from "./auth.repository";
import type { RegisterDTO, AuthUser } from "./auth.types";

const VERIFICATION_TOKEN_MINUTES = 60 * 24;
const RESET_TOKEN_MINUTES = 15;

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

  async findById(id: string): Promise<AuthUser | null> {
    const user = await authRepository.findById(id);
    if (!user) return null;
    return publicUser(user);
  },
};
