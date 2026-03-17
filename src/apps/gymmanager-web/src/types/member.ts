export type MemberStatus = "Active" | "Frozen" | "Expired" | "Cancelled";

export interface MemberDto {
  id: string;
  userId: string;
  gymHouseId: string;
  memberCode: string;
  fullName: string;
  email: string;
  phone: string | null;
  status: MemberStatus;
  joinedAt: string;
}

export interface CreateMemberRequest {
  userId: string;
  gymHouseId: string;
  email: string;
  fullName: string;
  phone?: string;
}

export interface UpdateMemberRequest {
  fullName: string;
  phone?: string;
  status: MemberStatus;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}
