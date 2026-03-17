export type BookingType = "TimeSlot" | "ClassSession";
export type BookingStatus =
  | "Confirmed"
  | "Cancelled"
  | "NoShow"
  | "Completed"
  | "WaitListed";
export type CheckInSource = "QRScan" | "ManualByStaff" | "SelfKiosk";

export interface BookingDto {
  id: string;
  memberId: string;
  gymHouseId: string;
  bookingType: number;
  timeSlotId: string | null;
  classScheduleId: string | null;
  status: number;
  bookedAt: string;
  checkedInAt: string | null;
  checkInSource: number | null;
  memberName: string;
  memberCode: string;
}

export interface TimeSlotDto {
  id: string;
  gymHouseId: string;
  date: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  currentBookings: number;
  availableSpots: number;
}

export interface ClassScheduleDto {
  id: string;
  gymHouseId: string;
  trainerId: string;
  trainerName: string;
  className: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  currentEnrollment: number;
  availableSpots: number;
  isRecurring: boolean;
}

export interface CreateBookingRequest {
  memberId: string;
  bookingType: number;
  timeSlotId?: string;
  classScheduleId?: string;
}

export interface CreateTimeSlotRequest {
  date: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
}

export interface CreateClassScheduleRequest {
  trainerId: string;
  className: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  isRecurring: boolean;
}

export interface UpdateClassScheduleRequest {
  className: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  isRecurring: boolean;
}

export interface CheckInRequest {
  source: number;
}
