import { db } from "@/lib/db";
import { AppError } from "@/modules/shared/errors";
import { z } from "zod";
import bcrypt from "bcrypt";

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});

export type UpdateProfileDTO = z.infer<typeof updateProfileSchema>;
export type UpdatePasswordDTO = z.infer<typeof updatePasswordSchema>;

export const userService = {
  async updateProfile(userId: string, data: UpdateProfileDTO) {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError("User not found", 404, "NOT_FOUND");

    return db.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
      },
    });
  },

  async updatePassword(userId: string, data: UpdatePasswordDTO) {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError("User not found", 404, "NOT_FOUND");

    if (!user.password) {
      throw new AppError("User signed up with OAuth", 400, "BAD_REQUEST");
    }

    const isValid = await bcrypt.compare(data.currentPassword, user.password);
    if (!isValid) throw new AppError("Invalid current password", 400, "INVALID_PASSWORD");

    const hashedPassword = await bcrypt.hash(data.newPassword, 10);
    await db.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { success: true };
  },

  async getUser(userId: string) {
    if (!userId) return null;
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { addresses: true },
    });
    return user;
  }
};
