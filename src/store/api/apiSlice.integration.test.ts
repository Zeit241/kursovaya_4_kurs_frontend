import { configureStore } from "@reduxjs/toolkit";
import { beforeEach, describe, expect, it } from "vitest";

import { api } from "./apiSlice";
import {
	mockAppointment,
	mockDoctor,
	mockPatient,
	mockQueue,
	mockReview,
	mockRoom,
	mockSchedule,
	mockService,
	mockSpecialization,
	mockUser,
	mockUserStats,
} from "@/test/msw/handlers";

function createIntegrationStore() {
	return configureStore({
		reducer: { [api.reducerPath]: api.reducer },
		middleware: (gDM) => gDM().concat(api.middleware),
	});
}

describe("apiSlice integration (MSW + RTK Query)", () => {
	let store: ReturnType<typeof createIntegrationStore>;

	beforeEach(() => {
		store = createIntegrationStore();
	});

	it("login mutation returns token and role", async () => {
		const result = await store
			.dispatch(
				api.endpoints.login.initiate({ email: "user@test.ru", password: "secret" })
			)
			.unwrap();

		expect(result.data?.token).toBe("test-token");
		expect(result.data?.roleCode).toBe("patient");
	});

	it("register mutation succeeds", async () => {
		const result = await store
			.dispatch(
				api.endpoints.register.initiate({
					email: "new@test.ru",
					phone: "+7999",
					password: "pass",
					confirmPassword: "pass",
					fio: "Новый Пользователь",
				})
			)
			.unwrap();

		expect(result.data?.token).toBe("new-token");
	});

	it("registerWithPatient mutation returns user and patient", async () => {
		const result = await store
			.dispatch(
				api.endpoints.registerWithPatient.initiate({
					email: "p@test.ru",
					phone: "+7999",
					password: "pass",
					confirmPassword: "pass",
					fio: "Пациент Тест",
					birthDate: "1990-01-01",
					gender: 1,
				})
			)
			.unwrap();

		expect(result.data?.patient?.id).toBe(mockPatient.id);
	});

	it("resetPassword mutation succeeds", async () => {
		const result = await store
			.dispatch(
				api.endpoints.resetPassword.initiate({ token: "t", password: "new-pass" })
			)
			.unwrap();

		expect(result).toMatchObject({ success: true });
	});

	it("getUsers query unwraps user list", async () => {
		const users = await store.dispatch(api.endpoints.getUsers.initiate()).unwrap();
		expect(users).toHaveLength(1);
		expect(users[0].email).toBe(mockUser.email);
	});

	it("getUserStats query returns statistics", async () => {
		const stats = await store.dispatch(api.endpoints.getUserStats.initiate()).unwrap();
		expect(stats).toEqual(mockUserStats);
	});

	it("getUserById query returns a user", async () => {
		const user = await store.dispatch(api.endpoints.getUserById.initiate(1)).unwrap();
		expect(user.id).toBe(1);
	});

	it("createUser mutation returns created user", async () => {
		const user = await store
			.dispatch(
				api.endpoints.createUser.initiate({
					email: "x@y.ru",
					phone: "+7",
					password: "p",
					confirmPassword: "p",
					fio: "A B C",
				})
			)
			.unwrap();

		expect(user.id).toBe(mockUser.id);
	});

	it("updateUser mutation returns updated user", async () => {
		const user = await store
			.dispatch(api.endpoints.updateUser.initiate({ id: 1, body: { email: "upd@t.ru" } }))
			.unwrap();

		expect(user.id).toBe(1);
	});

	it("getDoctors query unwraps doctor list", async () => {
		const doctors = await store.dispatch(api.endpoints.getDoctors.initiate()).unwrap();
		expect(doctors[0].displayName).toBe(mockDoctor.displayName);
	});

	it("getDoctorById query unwraps doctor dto", async () => {
		const doctor = await store.dispatch(api.endpoints.getDoctorById.initiate(10)).unwrap();
		expect(doctor.id).toBe(10);
	});

	it("createDoctor mutation returns doctor", async () => {
		const doctor = await store
			.dispatch(
				api.endpoints.createDoctor.initiate({
					password: "TempPass123",
					user: {
						email: "d@d.ru",
						firstName: "Doc",
						lastName: "Tor",
						middleName: "",
					},
					displayName: "Doc Tor",
				})
			)
			.unwrap();

		expect(doctor.id).toBe(mockDoctor.id);
	});

	it("updateDoctor mutation returns doctor", async () => {
		const doctor = await store
			.dispatch(
				api.endpoints.updateDoctor.initiate({ id: 10, body: { displayName: "Updated" } })
			)
			.unwrap();

		expect(doctor.id).toBe(10);
	});

	it("deleteDoctor mutation completes", async () => {
		const result = await store.dispatch(api.endpoints.deleteDoctor.initiate(10)).unwrap();
		expect(result).toBeNull();
	});

	it("getSpecializations query returns list", async () => {
		const items = await store.dispatch(api.endpoints.getSpecializations.initiate()).unwrap();
		expect(items[0].code).toBe(mockSpecialization.code);
	});

	it("getServices query returns clinic services", async () => {
		const services = await store.dispatch(api.endpoints.getServices.initiate()).unwrap();
		expect(services[0].name).toBe(mockService.name);
	});

	it("createService mutation returns service", async () => {
		const service = await store
			.dispatch(
				api.endpoints.createService.initiate({
					name: "Услуга",
					price: 1000,
					durationMinutes: 20,
				})
			)
			.unwrap();

		expect(service.id).toBe(mockService.id);
	});

	it("getPatients query unwraps patients", async () => {
		const patients = await store.dispatch(api.endpoints.getPatients.initiate()).unwrap();
		expect(patients[0].id).toBe(mockPatient.id);
	});

	it("getPatientById query unwraps patient entity", async () => {
		const patient = await store.dispatch(api.endpoints.getPatientById.initiate(20)).unwrap();
		expect(patient.id).toBe(20);
	});

	it("createPatient mutation returns patient", async () => {
		const patient = await store
			.dispatch(
				api.endpoints.createPatient.initiate({
					password: "TempPass123",
					user: {
						email: "p@p.ru",
						firstName: "P",
						lastName: "P",
					},
				})
			)
			.unwrap();

		expect(patient.id).toBe(mockPatient.id);
	});

	it("getAppointments query returns appointments", async () => {
		const appointments = await store.dispatch(api.endpoints.getAppointments.initiate()).unwrap();
		expect(appointments[0].id).toBe(mockAppointment.id);
	});

	it("getAppointmentById query unwraps appointment", async () => {
		const appointment = await store
			.dispatch(api.endpoints.getAppointmentById.initiate(100))
			.unwrap();

		expect(appointment.id).toBe(100);
	});

	it("bookAppointment mutation books slot", async () => {
		const appointment = await store
			.dispatch(
				api.endpoints.bookAppointment.initiate({ appointmentId: 100, userId: 3, serviceId: 30 })
			)
			.unwrap();

		expect(appointment.id).toBe(mockAppointment.id);
	});

	it("cancelAppointment mutation returns cancel response", async () => {
		const response = await store
			.dispatch(api.endpoints.cancelAppointment.initiate({ id: 100 }))
			.unwrap();

		expect(response.success).toBe(true);
		expect(response.appointment.id).toBe(mockAppointment.id);
	});

	it("getSchedules query returns schedules", async () => {
		const schedules = await store.dispatch(api.endpoints.getSchedules.initiate()).unwrap();
		expect(schedules[0].id).toBe(mockSchedule.id);
	});

	it("createSchedule mutation returns schedule", async () => {
		const schedule = await store
			.dispatch(
				api.endpoints.createSchedule.initiate({
					doctor: { id: 10 },
					dateAt: "2025-06-16",
					startTime: "09:00:00",
					endTime: "12:00:00",
					slotDurationMinutes: 30,
				})
			)
			.unwrap();

		expect(schedule.doctorId).toBe(mockSchedule.doctorId);
	});

	it("getQueueByDoctor query returns queue entries", async () => {
		const queue = await store.dispatch(api.endpoints.getQueueByDoctor.initiate(10)).unwrap();
		expect(queue[0].position).toBe(mockQueue.position);
	});

	it("getReviewsByDoctor query returns reviews", async () => {
		const reviews = await store.dispatch(api.endpoints.getReviewsByDoctor.initiate(10)).unwrap();
		expect(reviews[0].rating).toBe(mockReview.rating);
	});

	it("getRooms query returns rooms", async () => {
		const rooms = await store.dispatch(api.endpoints.getRooms.initiate()).unwrap();
		expect(rooms[0].code).toBe(mockRoom.code);
	});
});
