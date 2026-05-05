export interface AuthUser {
  id: string;
  name: string | null;
  email: string;
  role: "USER" | "ADMIN";
  avatar: string | null;
  emailVerified: Date | null;
}

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
  birthDate: Date;
  gender: "MALE" | "FEMALE";
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: AuthUser;
  token?: string;
}
