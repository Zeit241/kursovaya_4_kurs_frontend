import { describe, expect, it } from "vitest";

import type { LoginCurrentUserPayload, Patient, User } from "@/api/types";

import { mergeUserAfterPatientUpdate, userFromLoginPayload } from "./mapLoginUser";

const basePayload: LoginCurrentUserPayload = {
	id: 5,
	email: "test@example.com",
	phone: "+79990001122",
	firstName: "Алексей",
	lastName: "Сидоров",
	middleName: "Петрович",
	createdAt: "2025-01-10T00:00:00Z",
	updatedAt: "2025-01-11T00:00:00Z",
	active: true,
	patientId: null,
	doctorId: null,
};

describe("userFromLoginPayload", () => {
	it("maps core user fields with empty defaults", () => {
		const user = userFromLoginPayload({
			id: 1,
			email: "a@b.ru",
			createdAt: "2025-01-01T00:00:00Z",
			updatedAt: "2025-01-01T00:00:00Z",
			active: true,
		});

		expect(user.email).toBe("a@b.ru");
		expect(user.phone).toBe("");
		expect(user.firstName).toBe("");
		expect(user.role).toBeUndefined();
	});

	it("uses explicit roleCode when provided", () => {
		const user = userFromLoginPayload(basePayload, "doctor");
		expect(user.role).toBe("doctor");
	});

	it("embeds patient with gender defaulting to 1", () => {
		const user = userFromLoginPayload({
			...basePayload,
			patientId: 99,
			patient: {
				id: 99,
				birthDate: "1995-03-20",
				gender: 2,
				insuranceNumber: "INS-1",
			},
		});

		expect(user.patient?.id).toBe(99);
		expect(user.patient?.gender).toBe(2);
		expect(user.patient?.user.email).toBe(basePayload.email);
	});

	it("defaults patient gender to 1 when not equal to 2", () => {
		const user = userFromLoginPayload({
			...basePayload,
			patient: { id: 1, gender: 0 },
		});
		expect(user.patient?.gender).toBe(1);
	});
});

describe("mergeUserAfterPatientUpdate", () => {
	it("merges updated patient while preserving role and doctorId", () => {
		const prev: User = {
			id: basePayload.id,
			email: basePayload.email,
			phone: "",
			firstName: "",
			lastName: "",
			middleName: "",
			createdAt: basePayload.createdAt,
			updatedAt: basePayload.updatedAt,
			active: basePayload.active,
			role: "patient",
			patientId: 99,
			doctorId: null,
		};

		const updatedPatient: Patient = {
			id: 99,
			user: {
				...prev,
				firstName: "Новое",
				lastName: "Имя",
			},
			birthDate: "1990-01-01",
			gender: 1,
			insuranceNumber: null,
			createdAt: prev.createdAt,
			updatedAt: prev.updatedAt,
		};

		const merged = mergeUserAfterPatientUpdate(prev, updatedPatient);

		expect(merged.role).toBe("patient");
		expect(merged.doctorId).toBeNull();
		expect(merged.patientId).toBe(99);
		expect(merged.firstName).toBe("Новое");
		expect(merged.patient).toBe(updatedPatient);
	});
});
