import jwt from "jsonwebtoken";
import { config } from "../config.js";
import type {
  AuthenticatedSeller,
  JwtPayload,
  Tokens,
} from "../types/auth.js";

import type { StringValue } from "ms";

function sign(
  seller: AuthenticatedSeller & { passwordChangedAt?: number },
  secret: string,
  expiresIn: string,
  type: "access" | "refresh",
): string {
  return jwt.sign(
    {
      sub: seller.id,
      role: seller.role,
      status: seller.status,
      type,
      ...(seller.passwordChangedAt ? { passwordChangedAt: seller.passwordChangedAt } : {}),
    },
    secret,
    { expiresIn: expiresIn as StringValue },
  );
}

export const signAccess = (seller: AuthenticatedSeller): string =>
  sign(seller, config.jwtAccessSecret, config.accessExpiresIn, "access");

export const signRefresh = (seller: AuthenticatedSeller): string =>
  sign(
    seller,
    config.jwtRefreshSecret,
    config.refreshExpiresIn,
    "refresh",
  );

export const issueTokens = (seller: AuthenticatedSeller): Tokens => ({
  accessToken: signAccess(seller),
  refreshToken: signRefresh(seller),
});

export const verifyAccess = (token: string): JwtPayload =>
  jwt.verify(token, config.jwtAccessSecret) as JwtPayload;

export const verifyRefresh = (token: string): JwtPayload =>
  jwt.verify(token, config.jwtRefreshSecret) as JwtPayload;
