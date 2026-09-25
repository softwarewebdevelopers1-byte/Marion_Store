import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authLimiter } from "../middleware/rateLimit.js";
import { validate } from "../middleware/validate.js";
import { loginSchema, refreshSchema, registerSchema } from "../schemas/index.js";
import { login, refresh, register } from "../services/auth.js";
import { z } from "zod";
import { config } from "../config.js";

const router = Router();

const registerFullSchema = registerSchema.extend({
  phone: z.string().min(1),
  store: z.object({
    name: z.string().min(1),
    slug: z.string().min(1),
    tagline: z.string().optional(),
    description: z.string().optional(),
    logoUrl: z.string().optional(),
    bannerUrl: z.string().optional(),
    themeColor: z.string().optional(),
    currency: z.string().default("KES"),
    supportHours: z.string().optional(),
    social: z.object({ whatsapp: z.string().min(1) }),
  }),
});

router.post(
  "/login",
  authLimiter,
  validate({ body: loginSchema }),
  asyncHandler(async (req, res) => {
    const input = req.validated!.body as z.infer<typeof loginSchema>;
    const result = await login(input);
    res.json({ seller: result.seller, tokens: result.tokens });
  }),
);

router.post(
  "/refresh",
  authLimiter,
  validate({ body: refreshSchema }),
  asyncHandler(async (req, res) => {
    const input = req.validated!.body as z.infer<typeof refreshSchema>;
    const tokens = await refresh(input.refreshToken);
    res.json({ tokens });
  }),
);

router.post(
  "/register",
  authLimiter,
  validate({ body: registerFullSchema }),
  asyncHandler(async (req, res) => {
    if (!config.allowRegistration) {
      res.status(403).json({ message: "Registration is not allowed", code: "FORBIDDEN" });
      return;
    }
    const input = req.validated!.body as z.infer<typeof registerFullSchema>;
    const result = await register(input);
    res.status(201).json({ seller: result.seller, tokens: result.tokens });
  }),
);

export default router;
