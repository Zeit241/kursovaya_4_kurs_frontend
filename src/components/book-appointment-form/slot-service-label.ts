import type { AvailableAppointmentSlot } from "@/api/types";

/** Название услуги, если она заранее привязана к слоту; иначе пустая строка. */
export function slotServiceLabel(slot: AvailableAppointmentSlot): string {
	if (slot.service?.name) return slot.service.name;
	if (slot.serviceId != null) return `Услуга #${slot.serviceId}`;
	return "";
}
