import type { Appointment, Room } from "@/api/types";

type RoomLike = Pick<Room, "code" | "name"> & {
	displayName?: string | null;
	id?: number;
};

function isOpaqueRoomCode(code: string): boolean {
	return /^[a-f0-9]{32}$/i.test(code);
}

/** Человекочитаемое название кабинета из объекта room. */
export function roomDisplayName(
	room: RoomLike | Appointment["room"] | null | undefined,
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
	if (isOpaqueRoomCode(code)) {
		return room.id != null ? `Кабинет #${room.id}` : null;
	}
	return code;
}
