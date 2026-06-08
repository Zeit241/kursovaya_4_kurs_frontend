import type { Appointment } from "@/api/types";

export const statusLabels: Record<string, string> = {
	scheduled: "Запланирован",
	confirmed: "Подтверждён",
	in_progress: "В процессе",
	completed: "Завершён",
	cancelled: "Отменён",
	no_show: "Неявка",
	available: "Слот",
};

export function isOccupiedSlot(a: Appointment): boolean {
	return a.patientId != null && a.status !== "available";
}

export function formatDiagnosisLabel(a: Appointment): string {
	const d = a.diagnosis;
	if (d == null) return "—";
	if (typeof d === "string") return d || "—";
	return [d.code, d.name].filter(Boolean).join(" — ") || "—";
}

export function patientShortName(a: Appointment): string {
	const p = a.patient;
	if (!p) return a.patientId != null ? `Пациент #${a.patientId}` : "—";

	if ("fullName" in p && p.fullName?.trim()) {
		return p.fullName.trim();
	}

	if (p.user) {
		const u = p.user;
		const fromUser = [u.lastName, u.firstName, u.middleName].filter(Boolean).join(" ");
		if (fromUser) return fromUser;
	}

	const fromFlat = [p.lastName, p.firstName, p.middleName].filter(Boolean).join(" ");
	if (fromFlat) return fromFlat;

	return a.patientId != null ? `Пациент #${a.patientId}` : "—";
}

export { roomDisplayName } from "@/lib/room-display-name";

export const terminalStatuses = new Set([
	"completed",
	"cancelled",
	"no_show",
]);

/** Границы шкалы времени для визуальной доски (минуты от полуночи UTC-даты слота). */
export function timelineBounds(appointments: Appointment[]): {
	startMin: number;
	endMin: number;
	hours: number[];
} {
	const fallbackStart = 8 * 60;
	const fallbackEnd = 18 * 60;

	if (appointments.length === 0) {
		const hours: number[] = [];
		for (let h = 8; h <= 18; h++) hours.push(h);
		return { startMin: fallbackStart, endMin: fallbackEnd, hours };
	}

	let min = Infinity;
	let max = -Infinity;
	for (const a of appointments) {
		const s = new Date(a.startTime);
		const e = new Date(a.endTime);
		min = Math.min(min, s.getUTCHours() * 60 + s.getUTCMinutes());
		max = Math.max(max, e.getUTCHours() * 60 + e.getUTCMinutes());
	}

	const startHour = Math.max(0, Math.floor(min / 60) - 1);
	const endHour = Math.min(23, Math.ceil(max / 60) + 1);
	const hours: number[] = [];
	for (let h = startHour; h <= endHour; h++) hours.push(h);

	return {
		startMin: startHour * 60,
		endMin: endHour * 60,
		hours,
	};
}

export function blockPosition(
	startTime: string,
	endTime: string,
	startMin: number,
	endMin: number
): { left: number; width: number } {
	const span = Math.max(endMin - startMin, 1);
	const s = new Date(startTime);
	const e = new Date(endTime);
	const sMin = s.getUTCHours() * 60 + s.getUTCMinutes();
	const eMin = e.getUTCHours() * 60 + e.getUTCMinutes();
	const left = ((sMin - startMin) / span) * 100;
	const width = ((eMin - sMin) / span) * 100;
	return {
		left: Math.max(0, Math.min(100, left)),
		width: Math.max(2, Math.min(100 - left, width)),
	};
}
