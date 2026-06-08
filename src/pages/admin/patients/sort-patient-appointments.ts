import { compareAsc } from "date-fns";
import { appointmentTimeMs } from "@/lib/appointment-time";

export function sortPatientAppointments<T extends { startTime: string }>(response: T[]): T[] {
	return [...response].sort((a, b) => {
		const dateA = appointmentTimeMs(a.startTime);
		const dateB = appointmentTimeMs(b.startTime);
		const now = Date.now();
		const aIsPast = dateA < now;
		const bIsPast = dateB < now;
		if (aIsPast !== bIsPast) {
			return aIsPast ? 1 : -1;
		}
		if (!aIsPast && !bIsPast) {
			return compareAsc(dateA, dateB);
		}
		return compareAsc(dateB, dateA);
	});
}
