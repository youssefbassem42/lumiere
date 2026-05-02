import bcrypt from "bcrypt";
import { db } from "@/lib/db";
import type { RegisterDTO, AuthUser } from "./auth.types";

export const authService = {
  async register(data: RegisterDTO): Promise<AuthUser> {
    const existing = await db.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new Error("Email already in use");
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await db.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    };
  },

  async findById(id: string): Promise<AuthUser | null> {
    const user = await db.user.findUnique({ where: { id } });
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    };
  },
};
