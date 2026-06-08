import type { Appointment } from "@/api/types";

/** Человекочитаемое название кабинета из объекта room. */
export function roomDisplayName(
	room: Appointment["room"] | null | undefined
): string | null {
	if (!room) return null;
	const display = room.displayName?.trim();
	if (display) return display;
	const name = room.name?.trim();
	if (name) return name;
	const code = room.code?.trim();
	if (!code) return null;
	const lastUnderscore = code.lastIndexOf("_");
	if (lastUnderscore >= 0 && lastUnderscore < code.length - 1) {
		const suffix = code.substring(lastUnderscore + 1);
		if (/^\d+$/.test(suffix)) return `Кабинет №${suffix}`;
	}
	return code;
}
