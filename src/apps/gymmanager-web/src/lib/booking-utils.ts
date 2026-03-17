export function bookingTypeLabel(type: number): "Time Slot" | "Class Session" {
  if (type === 1) return "Class Session";
  return "Time Slot";
}

export function bookingStatusLabel(
  status: number
): "Confirmed" | "Cancelled" | "No Show" | "Completed" | "Wait Listed" {
  switch (status) {
    case 0:
      return "Confirmed";
    case 1:
      return "Cancelled";
    case 2:
      return "No Show";
    case 3:
      return "Completed";
    case 4:
      return "Wait Listed";
    default:
      return "Confirmed";
  }
}

export function checkInSourceLabel(
  source: number
): "QR Scan" | "Manual" | "Self Kiosk" {
  switch (source) {
    case 0:
      return "QR Scan";
    case 1:
      return "Manual";
    case 2:
      return "Self Kiosk";
    default:
      return "Manual";
  }
}

export function dayOfWeekLabel(
  day: number
):
  | "Sunday"
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday" {
  const labels = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ] as const;
  return labels[day] ?? "Sunday";
}
