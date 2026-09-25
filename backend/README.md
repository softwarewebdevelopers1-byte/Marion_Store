# Marion Store backend

## Seller settings

Authenticated sellers can manage their account through `/api/admin/account`. Every route requires `Authorization: Bearer <access-token>` and updates only the seller identified by the access token.

| Method | Endpoint | Purpose | Success response |
| --- | --- | --- | --- |
| GET | `/api/admin/account` | Read the full account | Seller admin JSON |
| PATCH | `/api/admin/account` | Partial profile, store, contact, address, business, payout metadata, and preference update | Seller admin JSON |
| POST | `/api/admin/account/password` | Change the current password | `204 No Content` |
| PUT | `/api/admin/account/payout` | Replace the payout account reference | Seller admin JSON |
| POST | `/api/admin/account/logo` | Upload a logo (`image`) | Seller admin JSON |
| DELETE | `/api/admin/account/logo` | Remove the logo | Seller admin JSON |
| POST | `/api/admin/account/banner` | Upload a banner (`image`) | Seller admin JSON |
| DELETE | `/api/admin/account/banner` | Remove the banner | Seller admin JSON |

The account response contains no password hash, refresh token hash, or payout account number. `payout.accountRef` is masked before it leaves the server.

### PATCH validation

`displayName` is 2–80 characters, email is a valid email, phone is 10–15 digits, slugs contain lowercase letters, numbers, and single hyphens, theme colours use `#RRGGBB`, currencies are three uppercase letters, and store text fields respect their documented maximum lengths. Unknown protected fields (`role`, `status`, hashes, stats, and verification flags) are rejected. `store.logoUrl` and `store.bannerUrl` are only managed by the upload endpoints. A duplicate slug returns `409 SLUG_TAKEN`; validation failures return `400 VALIDATION_ERROR` with dotted field keys. Email or phone changes return `requiresReverification: true` without changing the existing verification timestamp.

### Password policy and sessions

New passwords must be at least 10 characters and contain at least one letter and one number. The confirmation must match and differ from the current password. A wrong current password returns `401 INVALID_CURRENT_PASSWORD`; weak passwords return `400 WEAK_PASSWORD`; mismatches return `400 PASSWORD_MISMATCH`.

Password changes update `passwordChangedAt` and invalidate the stored refresh-token hash. Access tokens already issued remain usable for their normal lifetime, while refresh requests using tokens issued before the change are rejected. This signs out other devices without interrupting the request that changed the password. A new login is required when the current access token expires.

### Branding storage

Branding uploads use Multer memory storage and accept one JPEG, PNG, or WebP file up to 5 MB. The R2 key is `sellers/{sellerId}/branding/{uuid}.{ext}`. The server uploads the replacement first, updates the seller's public URL and private `logoKey`/`bannerKey`, saves the seller, invalidates the store cache, and then best-effort deletes the previous object. Deletes remove the object before clearing the URL and private key. Failed cleanup does not prevent a successful replacement from being used; cleanup errors are surfaced when deletion is explicitly requested.

R2 configuration uses the existing `R2_ENDPOINT`, `R2_ACCESS_KEY`, `R2_SECRET_KEY`, and `R2_BUCKET` environment variables. A public base URL should be configured for durable storefront image URLs; otherwise signed URLs expire according to the existing storage configuration.

### Audit logging

Account updates append `SellerAuditLog` records with seller and actor IDs, action, and changed top-level paths only. Values, passwords, payout references, and other PII are never written to the audit log.
