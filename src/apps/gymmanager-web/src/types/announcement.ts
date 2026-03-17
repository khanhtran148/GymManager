export type TargetAudience =
  | "AllMembers"
  | "ActiveMembers"
  | "Staff"
  | "Trainers"
  | "Everyone";

export interface AnnouncementDto {
  id: string;
  gymHouseId: string | null;
  authorId: string;
  authorName: string;
  title: string;
  content: string;
  targetAudience: TargetAudience;
  publishAt: string;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
}

export interface CreateAnnouncementRequest {
  gymHouseId: string | null;
  title: string;
  content: string;
  targetAudience: TargetAudience;
  publishAt: string;
}

export interface AnnouncementListResponse {
  items: AnnouncementDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}
