import { db } from "@/lib/db";
import type { RegisterDTO } from "./auth.types";

export const authRepository = {
  findByEmail(email: string) {
    return db.user.findUnique({ where: { email } });
  },

  findById(id: string) {
    return db.user.findUnique({ where: { id } });
  },

  createUser(data: RegisterDTO & { hashedPassword: string; verificationToken: string; verificationExpiry: Date }) {
    return db.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: data.hashedPassword,
        birthDate: data.birthDate,
        gender: data.gender,
        emailVerificationToken: data.verificationToken,
        emailVerificationExpiry: data.verificationExpiry,
      },
    });
  },

  verifyEmail(token: string, now = new Date()) {
    return db.user.updateMany({
      where: {
        emailVerificationToken: token,
        emailVerificationExpiry: { gt: now },
        emailVerified: null,
      },
      data: {
        emailVerified: now,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
      },
    });
  },

  setPasswordResetToken(email: string, token: string, expires: Date) {
    return db.user.update({
      where: { email },
      data: {
        resetToken: token,
        resetTokenExpiry: expires,
      },
    });
  },

  findByResetToken(token: string, now = new Date()) {
    return db.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: now },
      },
    });
  },

  updatePassword(userId: string, hashedPassword: string) {
    return db.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });
  },
};
