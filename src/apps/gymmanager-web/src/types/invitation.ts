export interface GymHousePublic {
  id: string;
  name: string;
  address: string;
}

export interface CreateInvitationRequest {
  email: string;
  role: 'HouseManager' | 'Trainer' | 'Staff' | 'Member';
  gymHouseId: string;
}

export interface InvitationResponse {
  id: string;
  email: string;
  role: string;
  gymHouseId: string;
  token: string;
  expiresAt: string;
  inviteUrl: string;
}

export interface AcceptInvitationRequest {
  password?: string;
  fullName?: string;
}
