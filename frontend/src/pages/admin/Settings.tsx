import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { accountService, isAccountError } from "../../services";
import { useAuth } from "../../auth/AuthContext";
import { useToast, QuantityStepper, Icons, Modal, ErrorState } from "../../components/ui";
import type { FullSeller, AccountUpdateBody, FieldErrors } from "../../types";

const TABS = [
  { id: "profile", label: "Profile" },
  { id: "store", label: "Store" },
  { id: "contact", label: "Contact" },
  { id: "address", label: "Address" },
  { id: "business", label: "Business" },
  { id: "payout", label: "Payout" },
  { id: "preferences", label: "Preferences" },
  { id: "branding", label: "Branding" },
  { id: "security", label: "Security" },
] as const;

const CURRENCIES = ["KES", "USD", "EUR", "GBP", "TZS", "UGX", "ZAR"];

type SellerSocial = {
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  x?: string;
};

type SetterFn = (
  updater: (prev: FullSeller) => Partial<FullSeller> & FullSeller,
) => void;

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { push } = useToast();
  const { refreshAccount } = useAuth();
  const [data, setData] = useState<FullSeller | null>(null);
  const [original, setOriginal] = useState<FullSeller | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tabParam = searchParams.get("tab") ?? "profile";
  const activeTab = TABS.some((t) => t.id === tabParam) ? tabParam : "profile";

  useEffect(() => {
    if (activeTab !== tabParam) {
      setSearchParams({ tab: activeTab });
    }
  }, [activeTab, tabParam, setSearchParams]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const seller = await accountService.get();
        setData(seller);
        setOriginal(JSON.parse(JSON.stringify(seller)));
      } catch (err) {
        const e = err as { status?: number };
        if (e.status === 401 || e.status === 403) {
          push("Session expired. Please sign in again.", "error");
          void navigate("/login", { replace: true });
        } else {
          setError("Could not load account settings.");
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [push, navigate]);

  const isDirty = useMemo(() => {
    if (!data || !original) return false;
    return JSON.stringify(data) !== JSON.stringify(original);
  }, [data, original]);

  const set = (
    updater: (prev: FullSeller) => Partial<FullSeller> & FullSeller,
  ): void => {
    setData((prev) => (prev ? { ...prev, ...updater(prev) } : prev));
  };

  const handleSave = async () => {
    if (!data || !original) return;
    setSaving(true);
    setErrors({});
    try {
      const patch = buildPatch(original, data);
      if (Object.keys(patch).length > 0) {
        const updated = await accountService.update(patch);
        setData(updated);
        setOriginal(JSON.parse(JSON.stringify(updated)));
        push("Settings updated.", "success");
        void refreshAccount();
      } else {
        push("No changes to save.", "info");
      }
    } catch (err) {
      if (isAccountError(err)) {
        if (err.status === 409 && err.code === "SLUG_TAKEN") {
          setErrors({ "store.slug": err.message });
        } else if (err.status === 400 && err.fields) {
          setErrors(err.fields);
        } else {
          push(err.message ?? "Could not save. Please try again.", "error");
        }
      } else {
        push("Could not save. Please try again.", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (original) {
      setData(JSON.parse(JSON.stringify(original)));
      setErrors({});
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  if (!data) return null;

  return (
    <div className="page-head" style={{ marginBottom: 16 }}>
      <div>
        <h1 style={{ margin: 0 }}>Account settings</h1>
        <p className="small muted" style={{ marginTop: 4 }}>
          Manage your profile, store, and preferences.
        </p>
      </div>

      <nav
        className="tabs"
        role="tablist"
        aria-label="Settings sections"
        style={{
          display: "flex",
          gap: 4,
          overflowX: "auto",
          paddingBottom: 4,
          marginBottom: 16,
          borderBottom: "1px solid var(--border)",
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={activeTab === t.id}
            aria-controls={`panel-${t.id}`}
            id={`tab-${t.id}`}
            className={`btn btn-ghost small ${activeTab === t.id ? "active" : ""}`}
            style={{
              borderBottom:
                activeTab === t.id
                  ? "2px solid var(--accent)"
                  : "2px solid transparent",
              borderRadius: 0,
              padding: "8px 16px",
              whiteSpace: "nowrap",
            }}
            onClick={() => setSearchParams({ tab: t.id })}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {isDirty && activeTab !== "branding" && activeTab !== "security" && (
        <StickySaveBar
          onSave={handleSave}
          onDiscard={handleDiscard}
          saving={saving}
        />
      )}

      <div
        id={`panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
      >
        {activeTab === "profile" && (
          <ProfileForm
            data={data}
            set={set}
            errors={errors}
          />
        )}
        {activeTab === "store" && (
          <StoreForm
            data={data}
            set={set}
            errors={errors}
            setErrors={setErrors}
          />
        )}
        {activeTab === "contact" && (
          <ContactForm
            data={data}
            set={set}
            errors={errors}
          />
        )}
        {activeTab === "address" && (
          <AddressForm data={data} set={set} />
        )}
        {activeTab === "business" && <BusinessForm data={data} set={set} />}
        {activeTab === "payout" && (
          <PayoutForm
            data={data}
            set={set}
            onUpdated={() => void refreshAccount()}
          />
        )}
        {activeTab === "preferences" && (
          <PreferencesForm data={data} set={set} />
        )}
        {activeTab === "branding" && <BrandingForm data={data} set={set} />}
        {activeTab === "security" && (
          <SecurityForm
            onSaved={async () => {
              await refreshAccount();
            }}
          />
        )}
      </div>

      {activeTab !== "branding" && activeTab !== "security" && (
        <div className="row gap-2" style={{ marginTop: 24 }}>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || !isDirty}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          {isDirty && (
            <button
              className="btn btn-ghost"
              onClick={handleDiscard}
              disabled={saving}
            >
              Discard
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function buildPatch(
  original: FullSeller,
  current: FullSeller,
): AccountUpdateBody {
  const patch: Record<string, unknown> = {};
  for (const key of ["displayName", "email", "phone"] as const) {
    if (current[key] !== original[key]) patch[key] = current[key];
  }

  const store = changedObject(
    original.store as unknown as Record<string, unknown>,
    current.store as unknown as Record<string, unknown>,
    new Set(["logoUrl", "bannerUrl"]),
  );
  if (Object.keys(store).length > 0) {
    const originalSocial = (original.store.social ?? {}) as Record<string, unknown>;
    const currentSocial = (current.store.social ?? {}) as Record<string, unknown>;
    const social = changedObject(originalSocial, currentSocial);
    if (Object.keys(social).length > 0) store.social = social;
    patch.store = store;
  }

  for (const key of ["address", "business", "payout", "settings"] as const) {
    const before = (original[key] ?? {}) as Record<string, unknown>;
    const after = (current[key] ?? {}) as Record<string, unknown>;
    const excluded = new Set(
      key === "business" || key === "payout" ? ["isVerified"] : [],
    );
    if (key === "payout") excluded.add("accountRef");
    const objectPatch = changedObject(before, after, excluded);
    if (Object.keys(objectPatch).length > 0) patch[key] = objectPatch;
  }

  return patch as AccountUpdateBody;
}

function changedObject(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  excluded = new Set<string>(),
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(after)) {
    if (excluded.has(key)) continue;
    if (JSON.stringify(before[key]) !== JSON.stringify(value)) result[key] = value;
  }
  return result;
}

function StickySaveBar({
  onSave,
  onDiscard,
  saving,
}: {
  onSave: () => void;
  onDiscard: () => void;
  saving: boolean;
}) {
  return (
    <div
      className="card card-pad"
      style={{
        position: "sticky",
        bottom: 0,
        zIndex: 10,
        marginBottom: 16,
        boxShadow: "0 -2px 8px rgba(0,0,0,0.06)",
      }}
    >
      <div className="row between">
        <span className="small">You have unsaved changes</span>
        <div className="row gap-2">
          <button
            className="btn btn-ghost"
            onClick={onDiscard}
            disabled={saving}
          >
            Discard
          </button>
          <button
            className="btn btn-primary"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="stack gap-4">
      <div className="skeleton" style={{ height: 24, width: 160 }} />
      <div className="skeleton" style={{ height: 20, width: 320 }} />
      <div className="stack gap-4" style={{ marginTop: 16 }}>
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="card card-pad">
            <div
              className="skeleton"
              style={{ height: 20, width: 120, marginBottom: 12 }}
            />
            <div
              className="skeleton"
              style={{ height: 40, width: "100%", marginBottom: 8 }}
            />
            <div
              className="skeleton"
              style={{ height: 40, width: "60%", marginBottom: 8 }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileForm({
  data,
  set,
  errors,
}: {
  data: FullSeller;
  set: SetterFn;
  errors: FieldErrors;
}) {
  return (
    <section className="card card-pad">
      <h3>Profile</h3>
      <div className="field">
        <label className="label" htmlFor="displayName">
          Display name
        </label>
        <input
          id="displayName"
          className="input"
          minLength={2}
          maxLength={80}
          required
          value={data.displayName ?? ""}
          onChange={(e) => set((p) => ({ ...p, displayName: e.target.value }))}
        />
        {errors.displayName && (
          <div className="field-error" role="alert">{errors.displayName}</div>
        )}
      </div>
      <div className="field">
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          className="input"
          required
          value={data.email ?? ""}
          onChange={(e) => set((p) => ({ ...p, email: e.target.value }))}
        />
        {errors.email && <div className="field-error" role="alert">{errors.email}</div>}
      </div>
        {data.requiresReverification && (
          <div className="help">You may need to verify your new email.</div>
        )}
        <div className="field">
          <label className="label" htmlFor="phone">

          Phone
        </label>
        <input
          id="phone"
          type="tel"
          className="input"
          placeholder="254712345678"
          inputMode="numeric"
          pattern="[0-9]{10,15}"
          required
          value={data.phone ?? ""}
          onChange={(e) => set((p) => ({ ...p, phone: e.target.value }))}
        />
        {errors.phone && <div className="field-error" role="alert">{errors.phone}</div>}
        <div className="help">
          International format, digits only. E.g. 254712345678
        </div>
      </div>
    </section>
  );
}

function StoreForm({
  data,
  set,
  errors,
  setErrors,
}: {
  data: FullSeller;
  set: SetterFn;
  errors: FieldErrors;
  setErrors: Dispatch<SetStateAction<FieldErrors>>;
}) {
  const store = data.store ?? ({} as Record<string, unknown>);
  const storeRecord = store as unknown as Record<string, unknown>;

  return (
    <section className="card card-pad">
      <h3>Store</h3>
      <div className="field">
        <label className="label" htmlFor="storeName">
          Store name
        </label>
        <input
          id="storeName"
          className="input"
          minLength={2}
          maxLength={80}
          required
          value={(storeRecord.name ?? "") as string}
          onChange={(e) =>
            set((p) => ({
              ...p,
              store: { ...(p.store ?? {}), name: e.target.value },
            }))
          }
        />
        {errors["store.name"] && (
          <div className="field-error" role="alert">{errors["store.name"]}</div>
        )}
      </div>
      <div className="field">
        <label className="label" htmlFor="storeSlug">
          Slug
        </label>
        <input
          id="storeSlug"
          className="input"
          placeholder="kesi-store"
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          value={(storeRecord.slug ?? "") as string}
          onBlur={(e) => {
            const value = e.target.value;
            if (value && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
              setErrors((current) => ({
                ...current,
                "store.slug": "Use lowercase letters, numbers, and hyphens only.",
              }));
            }
          }}
          onChange={(e) =>
            set((p) => ({
              ...p,
              store: { ...(p.store ?? {}), slug: e.target.value },
            }))
          }
        />
        {errors["store.slug"] && (
          <div className="field-error" role="alert">{errors["store.slug"]}</div>
        )}
      </div>
      <div className="field">
        <label className="label" htmlFor="storeTagline">
          Tagline
        </label>
        <input
          id="storeTagline"
          className="input"
          maxLength={140}
          value={(storeRecord.tagline ?? "") as string}
          onChange={(e) =>
            set((p) => ({
              ...p,
              store: { ...(p.store ?? {}), tagline: e.target.value },
            }))
          }
        />
      </div>
      <div className="field">
        <label className="label" htmlFor="storeDescription">
          Description
        </label>
        <textarea
          id="storeDescription"
          className="textarea"
          maxLength={2000}
          value={(storeRecord.description ?? "") as string}
          onChange={(e) =>
            set((p) => ({
              ...p,
              store: { ...(p.store ?? {}), description: e.target.value },
            }))
          }
        />
        <div className="help">
          {2000 - String(storeRecord.description ?? "").length} characters remaining
        </div>
      </div>
      <div className="row gap-4 wrap">
        <div className="field grow">
          <label className="label" htmlFor="storeColor">
            Theme colour
          </label>
          <input
            id="storeColor"
            type="color"
            className="input"
            style={{ padding: 0, height: 40, width: 60 }}
            value={(storeRecord.themeColor ?? "#0f172a") as string}
            onChange={(e) => {
              const color = e.target.value;
              document.documentElement.style.setProperty("--primary", color);
              set((p) => ({
                ...p,
                store: { ...(p.store ?? {}), themeColor: color },
              }));
            }}
          />
          <input
            id="storeColorHex"
            className="input"
            aria-label="Theme colour hex value"
            pattern="#[0-9A-Fa-f]{6}"
            value={(storeRecord.themeColor ?? "#0f172a") as string}
            onChange={(e) => {
              const color = e.target.value;
              if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
                document.documentElement.style.setProperty("--primary", color);
              }
              set((p) => ({
                ...p,
                store: { ...(p.store ?? {}), themeColor: color },
              }));
            }}
          />
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              document.documentElement.style.setProperty("--primary", "#0f172a");
              set((p) => ({
                ...p,
                store: { ...(p.store ?? {}), themeColor: "#0f172a" },
              }));
            }}
            style={{ marginTop: 6 }}
          >
            Reset to default
          </button>
        </div>
        <div className="field grow" style={{ minWidth: 160 }}>
          <label className="label" htmlFor="storeCurrency">
            Currency
          </label>
          <select
            id="storeCurrency"
            className="select"
            value={(storeRecord.currency ?? "KES") as string}
            onChange={(e) =>
              set((p) => ({
                ...p,
                store: { ...(p.store ?? {}), currency: e.target.value },
              }))
            }
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="field">
        <label className="label" htmlFor="storeHours">
          Support hours
        </label>
        <input
          id="storeHours"
          className="input"
          maxLength={80}
          value={(storeRecord.supportHours ?? "") as string}
          onChange={(e) =>
            set((p) => ({
              ...p,
              store: { ...(p.store ?? {}), supportHours: e.target.value },
            }))
          }
        />
      </div>
    </section>
  );
}

function ContactForm({
  data,
  set,
  errors,
}: {
  data: FullSeller;
  set: SetterFn;
  errors: FieldErrors;
}) {
  const store = data.store ?? ({} as Record<string, unknown>);
  const storeRecord = store as unknown as Record<string, unknown>;
  const social = (storeRecord.social ?? {}) as SellerSocial;
  const whatsapp = social.whatsapp ?? "";
  const waLink = whatsapp ? `https://wa.me/${whatsapp}` : "—";

  return (
    <section className="card card-pad">
      <h3>Contact</h3>
      <div className="field">
        <label className="label" htmlFor="whatsapp">
          WhatsApp number
        </label>
        <input
          id="whatsapp"
          type="tel"
          className="input"
          placeholder="254712345678"
          inputMode="numeric"
          pattern="[0-9]{7,15}"
          required
          value={whatsapp}
          onChange={(e) =>
            set((p) => ({
              ...p,
              store: {
                ...(p.store ?? {}),
                social: { ...(social ?? {}), whatsapp: e.target.value },
              },
            }))
          }
        />
        {errors["store.social.whatsapp"] && (
          <div className="field-error" role="alert">{errors["store.social.whatsapp"]}</div>
        )}
        <div className="help">
          Storefront enquiry link: <code>{waLink}</code>
        </div>
      </div>
      <SocialInput
        id="instagram"
        label="Instagram"
        placeholder="username"
        value={social.instagram ?? ""}
        onChange={(v) => setSocial(social, "instagram", v, set)}
      />
      <SocialInput
        id="facebook"
        label="Facebook"
        placeholder="page-name"
        value={social.facebook ?? ""}
        onChange={(v) => setSocial(social, "facebook", v, set)}
      />
      <SocialInput
        id="tiktok"
        label="TikTok"
        placeholder="username"
        value={social.tiktok ?? ""}
        onChange={(v) => setSocial(social, "tiktok", v, set)}
      />
      <SocialInput
        id="x"
        label="X (formerly Twitter)"
        placeholder="username"
        value={social.x ?? ""}
        onChange={(v) => setSocial(social, "x", v, set)}
      />
    </section>
  );
}

function setSocial(
  social: SellerSocial,
  key: keyof SellerSocial,
  value: string,
  set: SetterFn,
) {
  set((p) => ({
    ...p,
    store: {
      ...(p.store ?? {}),
      social: { ...(social ?? {}), [key]: value || undefined },
    },
  }));
}

function SocialInput({
  id,
  label,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="field">
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[@\s]/g, ""))}
      />
    </div>
  );
}

function AddressForm({ data, set }: { data: FullSeller; set: SetterFn }) {
  const addr = (data.address ?? {}) as Record<string, string | undefined>;
  const setField = (k: string, v: string) =>
    set((p) => ({
      ...p,
      address: { ...(p.address ?? {}), [k]: v },
    }));

  return (
    <section className="card card-pad">
      <h3>Address</h3>
      <div className="field">
        <label className="label" htmlFor="addr1">
          Line 1
        </label>
        <input
          id="addr1"
          className="input"
          value={addr.line1 ?? ""}
          onChange={(e) => setField("line1", e.target.value)}
        />
      </div>
      <div className="field">
        <label className="label" htmlFor="addr2">
          Line 2
        </label>
        <input
          id="addr2"
          className="input"
          value={addr.line2 ?? ""}
          onChange={(e) => setField("line2", e.target.value)}
        />
      </div>
      <div className="row gap-4 wrap">
        <div className="field grow">
          <label className="label" htmlFor="city">
            City
          </label>
          <input
            id="city"
            className="input"
            value={addr.city ?? ""}
            onChange={(e) => setField("city", e.target.value)}
          />
        </div>
        <div className="field grow">
          <label className="label" htmlFor="county">
            County
          </label>
          <input
            id="county"
            className="input"
            value={addr.county ?? ""}
            onChange={(e) => setField("county", e.target.value)}
          />
        </div>
      </div>
      <div className="row gap-4 wrap">
        <div className="field grow">
          <label className="label" htmlFor="country">
            Country
          </label>
          <input
            id="country"
            className="input"
            value={addr.country ?? "Kenya"}
            onChange={(e) => setField("country", e.target.value)}
          />
        </div>
        <div className="field grow">
          <label className="label" htmlFor="postalCode">
            Postal code
          </label>
          <input
            id="postalCode"
            className="input"
            value={addr.postalCode ?? ""}
            onChange={(e) => setField("postalCode", e.target.value)}
          />
        </div>
      </div>
    </section>
  );
}

function BusinessForm({ data, set }: { data: FullSeller; set: SetterFn }) {
  const biz = (data.business ?? {}) as Record<string, unknown>;
  const verified = biz.isVerified === true;

  return (
    <section className="card card-pad">
      <h3>Business</h3>
      {verified && (
        <div className="row gap-2" style={{ marginBottom: 12 }}>
          <span className="badge badge-success">Verified</span>
          <span className="small muted">
            Contact support to update verified business details.
          </span>
        </div>
      )}
      <div className="field">
        <label className="label" htmlFor="legalName">
          Legal name
        </label>
        <input
          id="legalName"
          className="input"
          value={(biz.legalName ?? "") as string}
          onChange={(e) =>
            set((p) => ({
              ...p,
              business: { ...(p.business ?? {}), legalName: e.target.value },
            }))
          }
          readOnly={verified}
        />
      </div>
      <div className="field">
        <label className="label" htmlFor="regNumber">
          Registration number
        </label>
        <input
          id="regNumber"
          className="input"
          value={(biz.regNumber ?? "") as string}
          onChange={(e) =>
            set((p) => ({
              ...p,
              business: { ...(p.business ?? {}), regNumber: e.target.value },
            }))
          }
          readOnly={verified}
        />
      </div>
      <div className="field">
        <label className="label" htmlFor="taxPin">
          Tax PIN
        </label>
        <input
          id="taxPin"
          className="input"
          value={(biz.taxPin ?? "") as string}
          onChange={(e) =>
            set((p) => ({
              ...p,
              business: { ...(p.business ?? {}), taxPin: e.target.value },
            }))
          }
          readOnly={verified}
        />
      </div>
    </section>
  );
}

function PayoutForm({
  data,
  set,
  onUpdated,
}: {
  data: FullSeller;
  set: SetterFn;
  onUpdated: () => void;
}) {
  const [showReplace, setShowReplace] = useState(false);
  const [newRef, setNewRef] = useState("");
  const { push } = useToast();
  const payout = data.payout ?? { provider: "NONE" as const };

  const handleReplace = async () => {
    if (!newRef.trim()) {
      push("Account reference is required", "error");
      return;
    }
    try {
      const updated = await accountService.updatePayout({ accountRef: newRef });
      set((p) => ({ ...p, payout: updated.payout ?? p.payout }));
      setShowReplace(false);
      setNewRef("");
      push("Payout method updated.", "success");
      onUpdated();
    } catch {
      push("Could not update payout method.", "error");
    }
  };

  return (
    <section className="card card-pad">
      <h3>Payout</h3>
      <div className="field">
        <label className="label" htmlFor="provider">
          Provider
        </label>
        <select
          id="provider"
          className="select"
          value={payout.provider ?? "NONE"}
          onChange={(e) =>
            set((p) => ({
              ...p,
              payout: {
                ...(p.payout ?? {}),
                provider: e.target.value as
                  "MPESA" | "BANK" | "STRIPE" | "NONE",
              },
            }))
          }
        >
          <option value="MPESA">M-Pesa</option>
          <option value="BANK">Bank transfer</option>
          <option value="STRIPE">Stripe</option>
          <option value="NONE">None</option>
        </select>
      </div>

      {payout.provider === "BANK" && (
        <div className="field">
          <label className="label" htmlFor="bankName">
            Bank name
          </label>
          <input
            id="bankName"
            className="input"
            value={payout.bankName ?? ""}
            onChange={(e) =>
              set((p) => ({
                ...p,
                payout: { ...(p.payout ?? { provider: "BANK" }), bankName: e.target.value },
              }))
            }
          />
        </div>
      )}

      {payout.provider &&
        payout.provider !== "STRIPE" &&
        payout.provider !== "NONE" && (
          <div className="field">
            <label className="label">Account reference</label>
            {payout.accountRef ? (
              <div className="row gap-2">
                <code>{payout.accountRef}</code>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowReplace(true)}
                >
                  Replace
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowReplace(true)}
              >
                Set account reference
              </button>
            )}
          </div>
        )}

      {payout.isVerified && (
        <div className="row gap-2" style={{ marginTop: 8 }}>
          <span className="badge badge-success">Verified</span>
        </div>
      )}

      {showReplace && (
        <Modal
          title="Replace payout method"
          open={showReplace}
          onClose={() => setShowReplace(false)}
          footer={
            <div className="row gap-2">
              <button
                className="btn btn-ghost"
                onClick={() => setShowReplace(false)}
              >
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleReplace}>
                Save
              </button>
            </div>
          }
        >
          <div className="field">
            <label className="label" htmlFor="newRef">
              New account reference
            </label>
            <input
              id="newRef"
              className="input"
              type="tel"
              placeholder={
                payout.provider === "MPESA" ? "254712345678" : "Account number"
              }
              value={newRef}
              onChange={(e) => setNewRef(e.target.value)}
            />
          </div>
        </Modal>
      )}
    </section>
  );
}

function PreferencesForm({ data, set }: { data: FullSeller; set: SetterFn }) {
  const prefs = data.settings;

  return (
    <section className="card card-pad">
      <h3>Preferences</h3>
      <fieldset
        style={{
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: 16,
        }}
      >
        <legend className="label">Default low-stock threshold</legend>
        <QuantityStepper
          value={prefs.defaultLowStockThreshold}
          min={0}
          max={999}
          onChange={(n) =>
            set((p) => ({
              ...p,
              settings: { ...p.settings, defaultLowStockThreshold: n },
            }))
          }
        />
        <div className="help">
          Applied to new products unless overridden per-product.
        </div>
      </fieldset>

      <ToggleSwitch
        label="Auto-hide out-of-stock products"
        helper="When ON, products with zero stock are hidden from the storefront."
        checked={prefs.autoHideOutOfStock}
        onChange={(v) =>
          set((p) => ({
            ...p,
            settings: { ...p.settings, autoHideOutOfStock: v },
          }))
        }
      />
      <ToggleSwitch
        label="Notify me when a product is low on stock"
        checked={prefs.notifyLowStock}
        onChange={(v) =>
          set((p) => ({
            ...p,
            settings: { ...p.settings, notifyLowStock: v },
          }))
        }
      />
      <ToggleSwitch
        label="Notify me when a customer sends an inquiry"
        checked={prefs.notifyNewInquiry}
        onChange={(v) =>
          set((p) => ({
            ...p,
            settings: { ...p.settings, notifyNewInquiry: v },
          }))
        }
      />
    </section>
  );
}

function ToggleSwitch({
  label,
  helper,
  checked,
  onChange,
}: {
  label: string;
  helper?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="row gap-2" style={{ marginBottom: 12 }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ margin: 0 }}
      />
      <div>
        <strong>{label}</strong>
        {helper && <div className="tiny muted">{helper}</div>}
      </div>
    </label>
  );
}

function BrandingForm({ data, set }: { data: FullSeller; set: SetterFn }) {
  const [logoUploading, setLogoUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const { push } = useToast();
  const { refreshAccount } = useAuth();
  const store = data.store ?? ({} as Record<string, unknown>);
  const storeRecord = store as unknown as Record<string, unknown>;

  const validateImage = (file: File): boolean => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      push("Use a JPEG, PNG, or WebP image.", "error");
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      push("Images must be 5 MB or smaller.", "error");
      return false;
    }
    return true;
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!validateImage(file)) {
      e.target.value = "";
      return;
    }
    setLogoUploading(true);
    try {
      const updated = await accountService.uploadLogo(file);
      set((p) => ({ ...p, store: updated.store }));
      push("Logo uploaded.", "success");
      void refreshAccount();
    } catch {
      push("Could not upload logo.", "error");
    } finally {
      setLogoUploading(false);
      e.target.value = "";
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!validateImage(file)) {
      e.target.value = "";
      return;
    }
    setBannerUploading(true);
    try {
      const updated = await accountService.uploadBanner(file);
      set((p) => ({ ...p, store: updated.store }));
      push("Banner uploaded.", "success");
      void refreshAccount();
    } catch {
      push("Could not upload banner.", "error");
    } finally {
      setBannerUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveLogo = async () => {
    try {
      const updated = await accountService.deleteLogo();
      set((p) => ({ ...p, store: updated.store }));
      push("Logo removed.", "success");
      void refreshAccount();
    } catch {
      push("Could not remove logo.", "error");
    }
  };

  const handleRemoveBanner = async () => {
    try {
      const updated = await accountService.deleteBanner();
      set((p) => ({ ...p, store: updated.store }));
      push("Banner removed.", "success");
      void refreshAccount();
    } catch {
      push("Could not remove banner.", "error");
    }
  };

  return (
    <section className="card card-pad">
      <h3>Branding</h3>
      <p className="small muted">
        JPEG, PNG or WebP. Max 5 MB. Recommended: logo 512x512, banner 1600x900.
      </p>

      <div className="field">
        <label className="label">Logo</label>
        {storeRecord.logoUrl ? (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <img
              src={storeRecord.logoUrl as string}
              alt="Logo preview"
              style={{
                width: 160,
                height: 160,
                objectFit: "contain",
                borderRadius: 8,
                border: "1px solid var(--border)",
              }}
            />
            <div className="column" style={{ gap: 6 }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleRemoveLogo}
              >
                Remove
              </button>
              <label
                className="btn btn-ghost"
                style={{ cursor: "pointer" }}
                htmlFor="logo-upload"
              >
                Replace
              </label>
              <input
                id="logo-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={handleLogoUpload}
              />
            </div>
          </div>
        ) : (
          <label
            className="dropzone"
            htmlFor="logo-upload"
            style={{ cursor: "pointer" }}
          >
            <div className="dropzone-icon">
              {logoUploading ? (
                <Icons.Alert size={24} />
              ) : (
                <Icons.Box size={24} />
              )}
            </div>
            <div className="small muted">
              {logoUploading ? "Uploading…" : "Click to upload logo"}
            </div>
            <input
              id="logo-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={handleLogoUpload}
            />
          </label>
        )}
      </div>

      <div className="field">
        <label className="label">Banner</label>
        {storeRecord.bannerUrl ? (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <img
              src={storeRecord.bannerUrl as string}
              alt="Banner preview"
              style={{
                width: 320,
                height: 180,
                objectFit: "cover",
                borderRadius: 8,
                border: "1px solid var(--border)",
              }}
            />
            <div className="column" style={{ gap: 6 }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleRemoveBanner}
              >
                Remove
              </button>
              <label
                className="btn btn-ghost"
                style={{ cursor: "pointer" }}
                htmlFor="banner-upload"
              >
                Replace
              </label>
              <input
                id="banner-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={handleBannerUpload}
              />
            </div>
          </div>
        ) : (
          <label
            className="dropzone"
            htmlFor="banner-upload"
            style={{ cursor: "pointer" }}
          >
            <div className="dropzone-icon">
              {bannerUploading ? (
                <Icons.Alert size={24} />
              ) : (
                <Icons.Box size={24} />
              )}
            </div>
            <div className="small muted">
              {bannerUploading ? "Uploading…" : "Click to upload banner"}
            </div>
            <input
              id="banner-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={handleBannerUpload}
            />
          </label>
        )}
      </div>
    </section>
  );
}

function SecurityForm({ onSaved }: { onSaved: () => Promise<void> }) {
  const { push } = useToast();
  const [current, setCurrent] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const validate = (): boolean => {
    const e: FieldErrors = {};
    if (!current) e.currentPassword = "Current password is required";
    if (newPw.length < 10 || !/[a-zA-Z]/.test(newPw) || !/\d/.test(newPw)) {
      e.newPassword =
        "Password must be at least 10 characters with one letter and one number";
    }
    if (newPw === current) {
      e.newPassword = "New password must be different from current";
    }
    if (newPw !== confirm) {
      e.confirmPassword = "Passwords do not match";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    setErrors({});
    try {
      await accountService.changePassword({
        currentPassword: current,
        newPassword: newPw,
        confirmPassword: confirm,
      });
      push("Password updated. Other devices have been signed out.", "success");
      setCurrent("");
      setNewPw("");
      setConfirm("");
      void onSaved();
    } catch (err) {
      const httpErr = err as { status?: number; message?: string };
      if (httpErr.status === 401) {
        setErrors({ currentPassword: "Current password is incorrect" });
      } else if (httpErr.status === 400) {
        setErrors({
          newPassword:
            httpErr.message ?? "New password does not meet requirements",
        });
      } else {
        push("Could not update password.", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card card-pad">
      <h3>Change password</h3>
      <p className="small muted">
        Changing your password signs you out of other devices. You'll stay
        signed in here.
      </p>

      <fieldset
        style={{
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: 16,
        }}
      >
        <legend className="label">Current password</legend>
        <PasswordInput
          id="current-password"
          value={current}
          onChange={setCurrent}
          error={errors.currentPassword}
        />
      </fieldset>

      <fieldset
        style={{
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: 16,
          marginTop: 12,
        }}
      >
        <legend className="label">New password</legend>
        <PasswordInput
          id="new-password"
          value={newPw}
          onChange={setNewPw}
          error={errors.newPassword}
          showHint
        />
      </fieldset>

      <fieldset
        style={{
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: 16,
          marginTop: 12,
        }}
      >
        <legend className="label">Confirm new password</legend>
        <PasswordInput
          id="confirm-password"
          value={confirm}
          onChange={setConfirm}
          error={errors.confirmPassword}
        />
      </fieldset>

      <div className="row gap-2" style={{ marginTop: 16 }}>
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving ? "Saving…" : "Update password"}
        </button>
      </div>
    </section>
  );
}

function PasswordInput({
  id,
  value,
  onChange,
  error,
  showHint,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  showHint?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const toggleRef = () => setVisible((v) => !v);

  return (
    <div className="input-group">
      <input
        id={id}
        type={visible ? "text" : "password"}
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      <button
        type="button"
        className="btn-icon"
        onClick={toggleRef}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
      >
        {visible ? <Icons.EyeOff size={18} /> : <Icons.Eye size={18} />}
      </button>
      {error && (
        <div id={`${id}-error`} className="field-error" role="alert" style={{ marginTop: 4 }}>
          {error}
        </div>
      )}
      {showHint && !error && (
        <div className="tiny muted" style={{ marginTop: 4 }}>
          At least 10 characters with one letter and one number.
        </div>
      )}
    </div>
  );
}
