import { get, post } from "@/lib/api-client";
import type { AuthResponse } from "@/types/auth";
import type {
  GymHousePublic,
  CreateInvitationRequest,
  InvitationResponse,
  AcceptInvitationRequest,
} from "@/types/invitation";

export interface GymHousePublicListResponse {
  items: GymHousePublic[];
}

export async function getPublicGymHouses(): Promise<GymHousePublic[]> {
  const response = await get<GymHousePublicListResponse>("/gym-houses/public");
  return response.items;
}

export async function createInvitation(
  data: CreateInvitationRequest
): Promise<InvitationResponse> {
  return post<InvitationResponse>("/invitations", data);
}

export async function acceptInvitation(
  token: string,
  data: AcceptInvitationRequest
): Promise<AuthResponse> {
  return post<AuthResponse>(`/invitations/${token}/accept`, data);
}
