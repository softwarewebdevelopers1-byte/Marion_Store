import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodTypeAny } from "zod";

interface ValidateSchemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

export const validate =
  (schemas: ValidateSchemas) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const validated: Record<string, unknown> = {};
    try {
      if (schemas.params) {
        validated.params = schemas.params.parse(req.params);
      }
      if (schemas.query) {
        validated.query = schemas.query.parse(req.query);
      }
      if (schemas.body) {
        validated.body = schemas.body.parse(req.body);
      }
      req.validated = validated;
      next();
    } catch (err) {
      next(err);
    }
  };

export const zodFields = (err: ZodError): Record<string, string> => {
  const fields: Record<string, string> = {};
  for (const issue of err.issues) {
    const path = issue.path.length ? issue.path.join(".") : "_";
    fields[path] = issue.message;
  }
  return fields;
};
