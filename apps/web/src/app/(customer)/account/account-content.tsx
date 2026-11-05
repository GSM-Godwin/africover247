"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Lock, AlertTriangle } from "lucide-react";
import { AuthInput } from "@/components/auth/auth-input";
import { PasswordStrengthIndicator } from "@/components/shared/password-strength-indicator";
import { ReauthModal } from "@/components/shared/reauth-modal";
import { useReauth } from "@/hooks/use-reauth";
import api from "@/lib/api";
import { getUser, setUser, logout } from "@/lib/auth";
import type { UserProfile } from "@/types/user";

const nigerianPhoneRegex = /^(\+234|0)[789][01]\d{8}$/;

const profileSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  phone: z
    .string()
    .regex(nigerianPhoneRegex, "Please enter a valid Nigerian phone number")
    .or(z.literal("")),
  alternativePhone: z
    .string()
    .regex(nigerianPhoneRegex, "Please enter a valid Nigerian phone number")
    .or(z.literal("")),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[A-Z])(?=.*\d).+$/,
        "Must contain at least one uppercase letter and one number",
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

function getApiErrorMessage(error: unknown): string | undefined {
  return (error as { response?: { data?: { message?: string | string[] } } })
    .response?.data?.message as string | undefined;
}

function normalizeApiMessage(message: string | string[] | undefined): string {
  if (Array.isArray(message)) return message[0] ?? "Something went wrong";
  return message ?? "Something went wrong";
}

export function AccountContent() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [commPrefs, setCommPrefs] = useState({
    preferredChannel: "email",
    renewalReminderPref: "standard",
  });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [isOAuthAccount, setIsOAuthAccount] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { showModal, requireReauth, onSuccess, onCancel } = useReauth();

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      alternativePhone: "",
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const watchedNewPassword = passwordForm.watch("newPassword", "");

  useEffect(() => {
    const storedUser = getUser();
    if (storedUser) {
      profileForm.reset({
        firstName: String(storedUser.firstName ?? ""),
        lastName: String(storedUser.lastName ?? ""),
        phone: String(storedUser.phone ?? ""),
        alternativePhone: String(storedUser.alternativePhone ?? ""),
      });
      setEmail(String(storedUser.email ?? ""));
    }

    api
      .get<UserProfile>("/users/me")
      .then((res) => {
        profileForm.reset({
          firstName: res.data.firstName,
          lastName: res.data.lastName,
          phone: res.data.phone ?? "",
          alternativePhone: res.data.alternativePhone ?? "",
        });
        setEmail(res.data.email);
        setCommPrefs({
          preferredChannel: res.data.preferredChannel || "email",
          renewalReminderPref: res.data.renewalReminderPref || "standard",
        });
        setIsOAuthAccount(Boolean(res.data.googleId || res.data.appleId));
      })
      .catch(() => {});
  }, []);

  async function onProfileSubmit(data: ProfileFormData) {
    setProfileLoading(true);
    try {
      const res = await api.put<UserProfile>("/users/me", {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || undefined,
        alternativePhone: data.alternativePhone || undefined,
      });
      setUser(res.data as unknown as Record<string, unknown>);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(normalizeApiMessage(getApiErrorMessage(error)));
    } finally {
      setProfileLoading(false);
    }
  }

  async function onPasswordSubmit(data: PasswordFormData) {
    setPasswordLoading(true);
    passwordForm.clearErrors("currentPassword");

    try {
      await api.post("/users/me/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast.success("Password changed successfully");
    } catch (error) {
      const message = normalizeApiMessage(getApiErrorMessage(error));
      if (message === "Current password is incorrect") {
        passwordForm.setError("currentPassword", { message });
      } else {
        toast.error(message);
      }
    } finally {
      setPasswordLoading(false);
    }
  }

  function handlePasswordFormAttempt(data: PasswordFormData) {
    requireReauth(() => void onPasswordSubmit(data));
  }

  async function handleSavePrefs() {
    setSavingPrefs(true);
    try {
      await api.patch("/users/me/preferences", commPrefs);
      toast.success("Communication preferences saved.");
    } catch {
      toast.error("Could not save preferences.");
    } finally {
      setSavingPrefs(false);
    }
  }

  async function handleDeleteAccount() {
    if (!isOAuthAccount && !deletePassword.trim()) {
      setDeleteError("Please enter your password.");
      return;
    }
    setDeleteLoading(true);
    setDeleteError("");
    try {
      await api.delete("/users/me", {
        data: isOAuthAccount ? {} : { password: deletePassword },
      });
      setDeleteModalOpen(false);
      logout();
      router.push("/login");
    } catch (error) {
      setDeleteError(normalizeApiMessage(getApiErrorMessage(error)));
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display font-bold text-midnight text-2xl sm:text-3xl mb-2">
          Account Settings
        </h1>
        <p className="font-body text-slate text-base">
          Manage your profile and security settings
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate/10 p-6 sm:p-8">
        <h2 className="font-body font-semibold text-midnight text-base mb-6">
          Personal Information
        </h2>

        <form
          onSubmit={profileForm.handleSubmit(onProfileSubmit)}
          className="space-y-6"
        >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AuthInput
                  label="First name"
                  placeholder="First name"
                  registration={profileForm.register("firstName")}
                  error={profileForm.formState.errors.firstName?.message}
                />
                <AuthInput
                  label="Last name"
                  placeholder="Last name"
                  registration={profileForm.register("lastName")}
                  error={profileForm.formState.errors.lastName?.message}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-body text-sm font-medium text-midnight">
                  Email address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    readOnly
                    disabled
                    className="w-full min-h-[44px] bg-transparent font-body text-base text-slate border-b border-slate/40 pb-2 outline-none disabled:cursor-not-allowed pr-8"
                  />
                  <Lock
                    size={16}
                    className="absolute right-0 bottom-3 text-slate/60"
                    aria-hidden
                  />
                </div>
                <p className="font-body text-xs text-slate">
                  Contact support to change
                </p>
              </div>

              <AuthInput
                label="Phone number"
                type="tel"
                placeholder="08012345678"
                registration={profileForm.register("phone")}
                error={profileForm.formState.errors.phone?.message}
              />

              <AuthInput
                label="Alternative phone (optional)"
                type="tel"
                placeholder="08012345678"
                registration={profileForm.register("alternativePhone")}
                error={profileForm.formState.errors.alternativePhone?.message}
              />

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="w-full sm:w-auto min-h-[44px] bg-daybreak text-midnight font-body font-bold text-sm px-6 py-3 rounded-lg hover:bg-[#D4921A] disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  {profileLoading && (
                    <Loader2 size={18} className="animate-spin" />
                  )}
                  {profileLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate/10 p-6 sm:p-8">
        <h2 className="font-body font-semibold text-midnight text-base mb-6">
          Change Password
        </h2>

        <form
          onSubmit={passwordForm.handleSubmit(handlePasswordFormAttempt)}
          className="space-y-6"
        >
              <AuthInput
                label="Current password"
                type="password"
                placeholder="••••••••••"
                registration={passwordForm.register("currentPassword")}
                error={passwordForm.formState.errors.currentPassword?.message}
              />

              <AuthInput
                label="New password"
                type="password"
                placeholder="••••••••••"
                registration={passwordForm.register("newPassword")}
                error={passwordForm.formState.errors.newPassword?.message}
              />

              <PasswordStrengthIndicator password={watchedNewPassword} />

              <AuthInput
                label="Confirm new password"
                type="password"
                placeholder="••••••••••"
                registration={passwordForm.register("confirmPassword")}
                error={passwordForm.formState.errors.confirmPassword?.message}
              />

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full sm:w-auto min-h-[44px] bg-daybreak text-midnight font-body font-bold text-sm px-6 py-3 rounded-lg hover:bg-[#D4921A] disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  {passwordLoading && (
                    <Loader2 size={18} className="animate-spin" />
                  )}
                  {passwordLoading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate/10 p-6">
        <h2 className="font-body font-semibold text-midnight text-base mb-5">
          Communication Preferences
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block font-body text-sm font-medium text-midnight mb-1.5">
              Preferred notification channel
            </label>
            <select
              value={commPrefs.preferredChannel}
              onChange={(e) => setCommPrefs((p) => ({ ...p, preferredChannel: e.target.value }))}
              className="w-full border border-slate/20 rounded-lg px-3 py-2.5 font-body text-sm focus:outline-none focus:border-daybreak"
            >
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="push">Push notification</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>
          <div>
            <label className="block font-body text-sm font-medium text-midnight mb-1.5">
              Renewal reminder frequency
            </label>
            <select
              value={commPrefs.renewalReminderPref}
              onChange={(e) => setCommPrefs((p) => ({ ...p, renewalReminderPref: e.target.value }))}
              className="w-full border border-slate/20 rounded-lg px-3 py-2.5 font-body text-sm focus:outline-none focus:border-daybreak"
            >
              <option value="standard">Standard — all reminders</option>
              <option value="fewer">Fewer reminders — key dates only</option>
              <option value="advisor">Advisor-assisted — I prefer to speak to someone</option>
            </select>
          </div>
          <button
            type="button"
            onClick={handleSavePrefs}
            disabled={savingPrefs}
            className="font-body font-bold text-sm bg-daybreak text-midnight px-5 py-2.5 rounded-xl hover:bg-[#D4921A] disabled:opacity-60 transition-colors"
          >
            {savingPrefs ? "Saving..." : "Save preferences"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-alert-coral/30 p-6 sm:p-8">
        <h2 className="font-body font-semibold text-alert-coral text-base mb-2">
          Danger Zone
        </h2>
        <p className="font-body text-slate text-sm mb-5">
          Permanently delete your account and personal data.
        </p>
        <button
          type="button"
          onClick={() => {
            setDeletePassword("");
            setDeleteError("");
            setDeleteModalOpen(true);
          }}
          className="font-body font-bold text-sm border border-alert-coral text-alert-coral px-5 py-2.5 rounded-xl hover:bg-alert-coral/5 transition-colors"
        >
          Delete Account
        </button>
      </div>

      <ReauthModal
        open={showModal}
        onSuccess={onSuccess}
        onCancel={onCancel}
        reason="Please confirm your password before changing your password."
      />

      {deleteModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-midnight/60 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="w-14 h-14 bg-alert-coral/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <AlertTriangle size={24} className="text-alert-coral" />
            </div>
            <h2 className="font-display font-bold text-midnight text-xl text-center mb-4">
              Delete Account
            </h2>
            <p className="font-body text-slate text-sm text-center mb-3">
              This permanently removes your name, email, phone number, KYC
              details, and any linked Google/Apple sign-in from your account.
            </p>
            <p className="font-body text-slate text-sm text-center mb-5">
              By NAICOM record-keeping rules, your policies, claims, payments
              and audit history must be retained and cannot be deleted — they
              will no longer be linked to your personal details.
            </p>

            {!isOAuthAccount && (
              <div className="mb-4">
                <AuthInput
                  label="Password"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter your password to confirm"
                  onKeyDown={(e) => e.key === "Enter" && handleDeleteAccount()}
                />
              </div>
            )}

            {deleteError && (
              <div className="bg-alert-coral/10 border border-alert-coral/20 rounded-xl px-4 py-3 mb-4">
                <p className="font-body text-sm text-alert-coral">{deleteError}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleteLoading}
                className="flex-1 border border-slate/20 text-slate font-body font-medium text-sm py-3 rounded-xl hover:bg-slate/5 disabled:opacity-60 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="flex-1 bg-alert-coral text-white font-body font-bold text-sm py-3 rounded-xl hover:bg-alert-coral/90 disabled:opacity-60 transition-colors"
              >
                {deleteLoading ? "Deleting..." : "Delete My Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
