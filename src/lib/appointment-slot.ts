import type { AvailableAppointmentSlot } from "@/api/types";
import { appointmentTimeMs } from "@/lib/appointment-time";

/** Слот доступен для записи: только status=available, без пациента, время в будущем. */
export function isBookableAppointmentSlot(
	slot: AvailableAppointmentSlot
): boolean {
	if (slot.status !== "available") return false;
	if (slot.patientId != null) return false;
	if (slot.isBooked) return false;
	return appointmentTimeMs(slot.startTime) > Date.now();
}

export function filterBookableSlots(
	slots: AvailableAppointmentSlot[]
): AvailableAppointmentSlot[] {
	return slots.filter(isBookableAppointmentSlot);
}
