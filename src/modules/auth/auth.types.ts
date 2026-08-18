import { Role } from "@prisma/client";

export interface AuthUser {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  avatar: string | null;
  emailVerified: Date | null;
}

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
  birthDate: Date;
  gender: "MALE" | "FEMALE";
  role?: Role;
  shopName?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResult {
  token: string;
  expiresAt: string;
  user: AuthUser;
}

export interface AuthResponse {
  user: AuthUser;
  token?: string;
}
