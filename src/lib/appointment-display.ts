import type { Appointment } from "@/api/types";
import { formatUserFullName } from "@/lib/formatUserFullName";
import { roomDisplayName } from "@/lib/room-display-name";

type AppointmentDoctor = NonNullable<Appointment["doctor"]> & {
	firstName?: string | null;
	lastName?: string | null;
	middleName?: string | null;
	specialization?: string | null;
};

/** ФИО или displayName врача из вложенного объекта приёма. */
export function appointmentDoctorName(appointment: Appointment): string {
	const doctor = appointment.doctor as AppointmentDoctor | null | undefined;
	if (!doctor) {
		return appointment.doctorId != null
			? `Врач #${appointment.doctorId}`
			: "Врач не указан";
	}
	if (doctor.displayName?.trim()) return doctor.displayName.trim();
	if (doctor.user) {
		const fromUser = formatUserFullName(doctor.user);
		if (fromUser) return fromUser;
	}
	const fromFlat = [doctor.lastName, doctor.firstName, doctor.middleName]
		.filter(Boolean)
		.join(" ");
	if (fromFlat) return fromFlat;
	return appointment.doctorId != null
		? `Врач #${appointment.doctorId}`
		: "Врач не указан";
}

/** Специальность врача из вложенного объекта приёма. */
export function appointmentDoctorSpecialty(appointment: Appointment): string {
	const doctor = appointment.doctor as AppointmentDoctor | null | undefined;
	if (!doctor) return "";
	if (doctor.specialization?.trim()) return doctor.specialization.trim();
	return doctor.specializations?.[0]?.name?.trim() ?? "";
}

/** Название кабинета для карточки приёма. */
export function appointmentRoomName(appointment: Appointment): string {
	return (
		roomDisplayName(appointment.room) ??
		(appointment.roomId != null
			? `Кабинет #${appointment.roomId}`
			: "Кабинет не указан")
	);
}
