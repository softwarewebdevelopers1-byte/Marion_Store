import { SellerModel, hashPassword, hashRefresh, compareHash } from "../models/Seller.js";
import AppError from "../appError.js";
import { issueTokens, verifyRefresh } from "./tokens.js";
import type { AuthenticatedSeller, JwtPayload, Tokens } from "../types/auth.js";
import type { Seller } from "../types/seller.js";
import { config } from "../config.js";
import { invalidateStoreCache } from "./products.js";

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
  phone: string;
  store: {
    name: string;
    slug: string;
    tagline?: string;
    description?: string;
    logoUrl?: string;
    bannerUrl?: string;
    themeColor?: string;
    currency: string;
    supportHours?: string;
    social: { whatsapp: string };
  };
}

export interface MeResponse {
  id: string;
  displayName: string;
  email: string;
  role: string;
  status: string;
  store: Seller["store"];
}

export async function login(
  input: LoginInput,
): Promise<{ seller: AuthenticatedSeller; tokens: Tokens }> {
  const seller = await SellerModel.findOne({
    email: input.email.toLowerCase(),
  })
    .select("+passwordHash +passwordChangedAt")
    .exec();
  if (!seller) throw new AppError(401, "Invalid credentials", "UNAUTHORIZED");

  const valid = await seller.comparePassword(input.password);
  if (!valid) throw new AppError(401, "Invalid credentials", "UNAUTHORIZED");

  if (seller.status !== "ACTIVE") {
    throw new AppError(403, "Seller account is not active", "ACCOUNT_NOT_ACTIVE");
  }

  const authenticated: AuthenticatedSeller & { passwordChangedAt?: number } = {
    id: seller._id.toString(),
    role: seller.role,
    status: seller.status,
    passwordChangedAt: seller.passwordChangedAt?.getTime(),
  };

  const tokens = issueTokens(authenticated);

  await SellerModel.updateOne(
    { _id: seller._id },
    { refreshTokenHash: await hashRefresh(tokens.refreshToken) },
  ).exec();

  return { seller: authenticated, tokens };
}

export async function me(sellerId: string): Promise<MeResponse> {
  const seller = await SellerModel.findById(sellerId).lean().exec();
  if (!seller) throw new AppError(404, "Seller not found", "NOT_FOUND");
  return {
    id: seller._id.toString(),
    displayName: seller.displayName,
    email: seller.email,
    role: seller.role,
    status: seller.status,
    store: seller.store,
  };
}

export async function logout(sellerId: string): Promise<void> {
  await SellerModel.updateOne(
    { _id: sellerId },
    { $unset: { refreshTokenHash: "" } },
  ).exec();
}

export async function refresh(refreshToken: string): Promise<Tokens> {
  let payload: JwtPayload;
  try {
    payload = verifyRefresh(refreshToken);
  } catch {
    throw new AppError(401, "Invalid refresh token", "UNAUTHORIZED");
  }

  if (payload.type !== "refresh") {
    throw new AppError(401, "Invalid token type", "UNAUTHORIZED");
  }

  const seller = await SellerModel.findById(payload.sub)
    .select("+refreshTokenHash +passwordChangedAt")
    .lean()
    .exec();
  if (!seller) throw new AppError(401, "Seller not found", "UNAUTHORIZED");

  if (!seller.refreshTokenHash) {
    throw new AppError(401, "Invalid refresh token", "UNAUTHORIZED");
  }
  const valid = await compareHash(refreshToken, seller.refreshTokenHash);
  if (!valid) throw new AppError(401, "Invalid refresh token", "UNAUTHORIZED");

  // Invalidate tokens issued before password change
  const tokenIat = payload.iat;
  const pwdChanged = seller.passwordChangedAt;
  if (tokenIat && pwdChanged && tokenIat < pwdChanged.getTime() / 1000) {
    throw new AppError(
      401,
      "Session expired due to password change on another device",
      "SESSION_INVALIDATED",
    );
  }

  const authenticated: AuthenticatedSeller & { passwordChangedAt?: number } = {
    id: seller._id.toString(),
    role: seller.role,
    status: seller.status,
    passwordChangedAt: seller.passwordChangedAt?.getTime(),
  };

  const tokens = issueTokens(authenticated);
  await SellerModel.updateOne(
    { _id: seller._id },
    { refreshTokenHash: await hashRefresh(tokens.refreshToken) },
  ).exec();

  return tokens;
}

export async function register(
  input: RegisterInput,
): Promise<{ seller: AuthenticatedSeller; tokens: Tokens }> {
  if (!config.allowRegistration) {
    throw new AppError(403, "Registration is not allowed", "FORBIDDEN");
  }

  const existing = await SellerModel.findOne({
    $or: [
      { email: input.email.toLowerCase() },
      { phone: input.phone },
    ],
  }).exec();
  if (existing) {
    throw new AppError(409, "Email or phone already registered", "DUPLICATE_KEY");
  }

  const passwordHash = await hashPassword(input.password);
  const seller = await SellerModel.create({
    email: input.email.toLowerCase(),
    phone: input.phone,
    displayName: input.displayName,
    role: "SELLER" as const,
    status: "ACTIVE" as const,
    passwordHash,
    emailVerifiedAt: new Date(),
    store: {
      name: input.store.name,
      slug: input.store.slug,
      tagline: input.store.tagline,
      description: input.store.description,
      logoUrl: input.store.logoUrl,
      bannerUrl: input.store.bannerUrl,
      themeColor: input.store.themeColor ?? "#0f172a",
      currency: input.store.currency,
      supportHours: input.store.supportHours,
      social: { whatsapp: input.store.social.whatsapp },
    },
  });

  invalidateStoreCache();

  const authenticated: AuthenticatedSeller = {
    id: seller._id.toString(),
    role: seller.role,
    status: seller.status,
  };

  const tokens = issueTokens(authenticated);
  await SellerModel.updateOne(
    { _id: seller._id },
    { refreshTokenHash: await hashRefresh(tokens.refreshToken) },
  ).exec();

  return { seller: authenticated, tokens };
}
