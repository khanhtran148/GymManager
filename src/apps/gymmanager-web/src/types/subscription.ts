export type SubscriptionType = "Monthly" | "Quarterly" | "Annual" | "DayPass";
export type SubscriptionStatus = "Active" | "Frozen" | "Expired" | "Cancelled";

export interface SubscriptionDto {
  id: string;
  memberId: string;
  gymHouseId: string;
  type: SubscriptionType;
  status: SubscriptionStatus;
  price: number;
  startDate: string;
  endDate: string;
  frozenAt: string | null;
  frozenUntil: string | null;
}

export const SUBSCRIPTION_TYPE_VALUES: Record<SubscriptionType, number> = {
  Monthly: 0,
  Quarterly: 1,
  Annual: 2,
  DayPass: 3,
};

export interface CreateSubscriptionRequest {
  type: number;
  price: number;
  startDate: string;
  endDate: string;
}

export interface RenewSubscriptionRequest {
  startDate: string;
  endDate: string;
  price: number;
}

export interface FreezeSubscriptionRequest {
  until: string;
}
