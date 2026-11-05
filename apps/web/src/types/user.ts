export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  alternativePhone: string | null;
  role: string;
  emailVerified: boolean;
  googleId?: string | null;
  appleId?: string | null;
  preferredChannel?: string;
  renewalReminderPref?: string;
  createdAt: string;
  updatedAt: string;
}
