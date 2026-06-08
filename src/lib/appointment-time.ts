import { format } from "date-fns";
import type { Locale } from "date-fns";
import { ru } from "date-fns/locale";

/**
 * API хранит локальное время клиники в ISO с суффиксом Z (wall-clock).
 * Без этого парсинг сдвигает часы по timezone браузера.
 */
export function toWallClockDate(iso: string): Date {
	const d = new Date(iso);
	return new Date(
		d.getUTCFullYear(),
		d.getUTCMonth(),
		d.getUTCDate(),
		d.getUTCHours(),
		d.getUTCMinutes(),
		d.getUTCSeconds(),
		d.getUTCMilliseconds()
	);
}

/** «HH:mm» — время приёма как в расписании клиники. */
export function formatAppointmentTime(iso: string): string {
	const d = new Date(iso);
	const h = d.getUTCHours().toString().padStart(2, "0");
	const m = d.getUTCMinutes().toString().padStart(2, "0");
	return `${h}:${m}`;
}

/** Дата приёма (date-fns, locale по умолчанию ru). */
export function formatAppointmentDate(
	iso: string,
	pattern = "d MMMM yyyy",
	locale: Locale = ru
): string {
	return format(toWallClockDate(iso), pattern, { locale });
}

/** Дата и время приёма одной строкой. */
export function formatAppointmentDateTime(
	iso: string,
	pattern: string,
	locale: Locale = ru
): string {
	return format(toWallClockDate(iso), pattern, { locale });
}

/** Timestamp для сравнений isPast / сортировки. */
export function appointmentTimeMs(iso: string): number {
	return toWallClockDate(iso).getTime();
}
