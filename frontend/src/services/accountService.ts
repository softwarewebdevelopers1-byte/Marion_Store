import { http, HttpError } from "./http";
import type { FullSeller, AccountUpdateBody } from "../types";

interface PayoutAccountBody {
  accountRef: string;
}

export const accountService = {
  async get(): Promise<FullSeller> {
    const seller = await http<FullSeller>("/admin/account");
    return seller;
  },

  async update(patch: AccountUpdateBody): Promise<FullSeller> {
    const seller = await http<FullSeller>("/admin/account", {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    return seller;
  },

  async changePassword(input: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<void> {
    await http<void>("/admin/account/password", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async uploadLogo(file: File): Promise<FullSeller> {
    const form = new FormData();
    form.append("image", file);
    const seller = await http<FullSeller>("/admin/account/logo", {
      method: "POST",
      body: form,
    });
    return seller;
  },

  async uploadBanner(file: File): Promise<FullSeller> {
    const form = new FormData();
    form.append("image", file);
    const seller = await http<FullSeller>("/admin/account/banner", {
      method: "POST",
      body: form,
    });
    return seller;
  },

  async deleteLogo(): Promise<FullSeller> {
    const seller = await http<FullSeller>("/admin/account/logo", {
      method: "DELETE",
    });
    return seller;
  },

  async deleteBanner(): Promise<FullSeller> {
    const seller = await http<FullSeller>("/admin/account/banner", {
      method: "DELETE",
    });
    return seller;
  },

  async updatePayout(body: PayoutAccountBody): Promise<FullSeller> {
    const seller = await http<FullSeller>("/admin/account/payout", {
      method: "PUT",
      body: JSON.stringify(body),
    });
    return seller;
  },
};

export function isAccountError(err: unknown): err is HttpError {
  return err instanceof HttpError;
}
