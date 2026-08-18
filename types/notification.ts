export interface OwnerNotification {
  id: string;
  type: string;
  title: string | null;
  body: string | null;
  data: string | null;
  createdAt: string;
  read: boolean;
}
