export type NotificationChannel = "InApp" | "Push" | "Email";
export type DeliveryStatus = "Pending" | "Sent" | "Delivered" | "Read" | "Failed";

export interface NotificationDto {
  id: string;
  announcementId: string;
  announcementTitle: string;
  announcementContent: string;
  channel: NotificationChannel;
  status: DeliveryStatus;
  sentAt: string | null;
  readAt: string | null;
}

export interface NotificationListResponse {
  items: NotificationDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface NotificationPreferenceDto {
  channel: NotificationChannel;
  isEnabled: boolean;
}

export interface UpdateNotificationPreferencesRequest {
  preferences: Array<{
    channel: NotificationChannel;
    isEnabled: boolean;
  }>;
}

export interface NotificationPushPayload {
  notificationId: string;
  announcementId: string;
  title: string;
  content: string;
  channel: NotificationChannel;
}
