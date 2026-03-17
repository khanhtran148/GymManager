export interface GymHouseDto {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  operatingHours: string | null;
  hourlyCapacity: number;
  ownerId: string;
  createdAt: string;
}

export interface CreateGymHouseRequest {
  name: string;
  address: string;
  phone?: string;
  operatingHours?: string;
  hourlyCapacity: number;
}

export interface UpdateGymHouseRequest {
  name: string;
  address: string;
  phone?: string;
  operatingHours?: string;
  hourlyCapacity: number;
}
