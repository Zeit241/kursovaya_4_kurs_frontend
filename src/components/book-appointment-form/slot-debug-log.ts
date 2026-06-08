import type { AvailableAppointmentSlot } from "@/api/types";
import { formatAppointmentTime } from "@/lib/appointment-time";

/** Временная отладка: сравнение id слотов на фронте и в БД. */
export function logAvailableSlotsDebug(
	slots: AvailableAppointmentSlot[],
	context: {
		doctorId: number;
		date: string;
		serviceId?: number;
	}
): void {
	const rows = slots.map((slot) => ({
		id: slot.id,
		startTimeRaw: slot.startTime,
		endTimeRaw: slot.endTime,
		uiTime: formatAppointmentTime(slot.startTime),
		patientId: slot.patientId ?? null,
		isBooked: slot.isBooked,
		status: slot.status,
		serviceId: slot.serviceId ?? null,
	}));

	console.group(
		`[BookAppointment] слоты врача #${context.doctorId}, дата ${context.date}${
			context.serviceId != null ? `, услуга #${context.serviceId}` : ""
		} (всего ${slots.length})`
	);
	console.table(rows);
	console.groupEnd();
}

export function logSlotSelectionDebug(
	slot: AvailableAppointmentSlot,
	context: { formTime: string; formSlotId: number }
): void {
	console.group("[BookAppointment] выбран слот");
	console.log({
		slotId: slot.id,
		formTime: context.formTime,
		formSlotId: context.formSlotId,
		startTimeRaw: slot.startTime,
		endTimeRaw: slot.endTime,
		uiTime: formatAppointmentTime(slot.startTime),
	});
	console.groupEnd();
}

export function logBookingSubmitDebug(
	slot: AvailableAppointmentSlot,
	bookBody: { appointmentId: number; userId: number; serviceId?: number }
): void {
	console.group("[BookAppointment] отправка бронирования");
	console.log("bookBody", bookBody);
	console.log("slot", {
		id: slot.id,
		startTimeRaw: slot.startTime,
		endTimeRaw: slot.endTime,
		uiTime: formatAppointmentTime(slot.startTime),
	});
	console.groupEnd();
}
