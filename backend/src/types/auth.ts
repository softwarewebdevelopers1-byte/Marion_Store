export interface JwtPayload {
  sub: string;
  role: string;
  status: string;
  type: "access" | "refresh";
  iat?: number;
  exp?: number;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthenticatedSeller {
  id: string;
  role: string;
  status: string;
}
