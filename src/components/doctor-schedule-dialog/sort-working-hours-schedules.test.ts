import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Schedule } from "@/api/types";

import { sortWorkingHoursSchedules } from "./sort-working-hours-schedules";

function schedule(id: number, dateAt: string): Schedule {
	return {
		id,
		doctorId: 1,
		roomId: null,
		dateAt,
		startTime: "09:00:00",
		endTime: "17:00:00",
		slotDurationMinutes: 30,
		createdAt: "2025-01-01T00:00:00Z",
		updatedAt: "2025-01-01T00:00:00Z",
	};
}

describe("sortWorkingHoursSchedules", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2025-06-15T12:00:00Z"));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("places future dates before past and today dates", () => {
		const sorted = sortWorkingHoursSchedules([
			schedule(1, "2025-06-10"),
			schedule(2, "2025-06-20"),
			schedule(3, "2025-06-15"),
		]);

		expect(sorted.map((s) => s.id)).toEqual([2, 1, 3]);
	});

	it("sorts ascending within the same past/future group", () => {
		const sorted = sortWorkingHoursSchedules([
			schedule(1, "2025-06-25"),
			schedule(2, "2025-06-22"),
		]);

		expect(sorted.map((s) => s.id)).toEqual([2, 1]);
	});

	it("pushes schedules without dateAt to the end", () => {
		const sorted = sortWorkingHoursSchedules([
			schedule(1, ""),
			schedule(2, "2025-06-20"),
		]);

		expect(sorted[0].id).toBe(2);
		expect(sorted[sorted.length - 1].id).toBe(1);
	});

	it("returns stable order for invalid ISO dates", () => {
		const input = [schedule(1, "not-a-date"), schedule(2, "also-bad")];
		expect(sortWorkingHoursSchedules(input).map((s) => s.id)).toEqual([1, 2]);
	});
});
