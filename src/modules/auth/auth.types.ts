export interface AuthUser {
  id: string;
  name: string | null;
  email: string;
  role: "USER" | "ADMIN";
  avatar: string | null;
}

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: AuthUser;
  token?: string;
}
