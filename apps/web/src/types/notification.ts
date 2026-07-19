export interface NotificationRecord {
  id: string;
  message: string;
  read: boolean;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: string;
}
