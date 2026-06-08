import { http, HttpResponse } from "msw";

import type {
	Appointment,
	ClinicService,
	DailyReport,
	Diagnosis,
	Doctor,
	Patient,
	Queue,
	Review,
	Room,
	Schedule,
	Specialization,
	User,
	UserStats,
} from "@/api/types";
import { API_BASE } from "@/store/api/utils";

const mockUser: User = {
	id: 1,
	email: "admin@test.ru",
	phone: "+79001234567",
	firstName: "Иван",
	lastName: "Иванов",
	middleName: "Иванович",
	createdAt: "2025-01-01T00:00:00Z",
	updatedAt: "2025-01-01T00:00:00Z",
	active: true,
	role: "admin",
	patientId: null,
	doctorId: null,
};

const mockDoctor: Doctor = {
	id: 10,
	user: { ...mockUser, id: 2, role: "doctor", doctorId: 10 },
	displayName: "Доктор Смит",
	bio: "Опытный врач",
	experienceYears: 12,
	photo: null,
	rating: 4.8,
	reviewCount: 5,
	specializations: [],
	specialization: null,
	createdAt: "2025-01-01T00:00:00Z",
	updatedAt: "2025-01-01T00:00:00Z",
};

const mockPatient: Patient = {
	id: 20,
	user: { ...mockUser, id: 3, role: "patient", patientId: 20 },
	birthDate: "1990-05-15",
	gender: 1,
	insuranceNumber: "1234567890",
	createdAt: "2025-01-01T00:00:00Z",
	updatedAt: "2025-01-01T00:00:00Z",
};

const mockSpecialization: Specialization = {
	id: 1,
	code: "therapist",
	name: "Терапевт",
	description: "Общая терапия",
};

const mockService: ClinicService = {
	id: 30,
	name: "Консультация",
	code: "CONSULT",
	price: 1500,
	durationMinutes: 30,
	description: "Первичная консультация",
};

const mockAppointment: Appointment = {
	id: 100,
	scheduleId: 50,
	doctorId: 10,
	patientId: 20,
	roomId: 1,
	startTime: "2025-06-15T10:00:00Z",
	endTime: "2025-06-15T10:30:00Z",
	status: "scheduled",
	source: "web",
	createdBy: 1,
	createdAt: "2025-06-01T00:00:00Z",
	updatedAt: "2025-06-01T00:00:00Z",
	cancelReason: null,
};

const mockSchedule: Schedule = {
	id: 50,
	doctorId: 10,
	roomId: 1,
	dateAt: "2025-06-15",
	startTime: "09:00:00",
	endTime: "17:00:00",
	slotDurationMinutes: 30,
	createdAt: "2025-06-01T00:00:00Z",
	updatedAt: "2025-06-01T00:00:00Z",
};

const mockQueue: Queue = {
	id: 200,
	doctorId: 10,
	appointmentId: 100,
	patientId: 20,
	position: 1,
	lastUpdated: "2025-06-15T10:00:00Z",
};

const mockReview: Review = {
	id: 300,
	appointmentId: 100,
	doctorId: 10,
	patientId: 20,
	patientName: "Иванов И.И.",
	rating: 5,
	reviewText: "Отличный врач",
	createdAt: "2025-06-16T00:00:00Z",
};

const mockRoom: Room = {
	id: 1,
	code: "101",
	name: "Кабинет 101",
};

const mockDiagnosis: Diagnosis = {
	id: 1,
	code: "J06.9",
	name: "ОРВИ",
	category: "respiratory",
};

const mockUserStats: UserStats = {
	appointmentsCount: 42,
	reviewsCount: 7,
	queueEntriesCount: 3,
};

const mockDailyReport: DailyReport = {
	date: "2025-06-15",
	totalAppointments: 10,
	scheduledCount: 5,
	completedCount: 3,
	cancelledCount: 1,
	noShowCount: 1,
	appointments: [],
};

export const handlers = [
	http.post(`${API_BASE}/auth/login`, async () =>
		HttpResponse.json({
			success: true,
			message: "OK",
			data: {
				token: "test-token",
				email: "user@test.ru",
				message: "Успешный вход",
				roleCode: "patient",
				user: {
					id: 3,
					email: "user@test.ru",
					firstName: "Пётр",
					lastName: "Петров",
					createdAt: "2025-01-01T00:00:00Z",
					updatedAt: "2025-01-01T00:00:00Z",
					active: true,
					patientId: 20,
				},
			},
		})
	),
	http.post(`${API_BASE}/auth/register`, async () =>
		HttpResponse.json({
			success: true,
			message: "OK",
			data: { token: "new-token", message: "Регистрация успешна" },
		})
	),
	http.post(`${API_BASE}/auth/register-with-patient`, async () =>
		HttpResponse.json({
			success: true,
			message: "OK",
			data: { token: "new-token", user: mockUser, patient: mockPatient, message: "OK" },
		})
	),
	http.post(`${API_BASE}/auth/forgot-password`, async () =>
		HttpResponse.json({ success: true, message: "Письмо отправлено" })
	),
	http.post(`${API_BASE}/auth/reset-password`, async () =>
		HttpResponse.json({ success: true, message: "Пароль изменён" })
	),

	http.get(`${API_BASE}/users`, () => HttpResponse.json({ success: true, data: [mockUser] })),
	http.get(`${API_BASE}/users/userStats`, () =>
		HttpResponse.json({ success: true, data: mockUserStats })
	),
	http.get(`${API_BASE}/users/:id`, ({ params }) =>
		HttpResponse.json({ ...mockUser, id: Number(params.id) })
	),
	http.post(`${API_BASE}/users/create`, async () => HttpResponse.json(mockUser)),
	http.put(`${API_BASE}/users/:id`, async ({ params }) =>
		HttpResponse.json({ ...mockUser, id: Number(params.id) })
	),
	http.delete(`${API_BASE}/users/:id`, () => new HttpResponse(null, { status: 204 })),

	http.get(`${API_BASE}/doctors`, () => HttpResponse.json({ success: true, data: [mockDoctor] })),
	http.get(`${API_BASE}/doctors/:id`, ({ params }) =>
		HttpResponse.json({ success: true, data: { ...mockDoctor, id: Number(params.id) } })
	),
	http.post(`${API_BASE}/doctors/create`, async () =>
		HttpResponse.json({ success: true, data: mockDoctor })
	),
	http.put(`${API_BASE}/doctors/:id`, async ({ params }) =>
		HttpResponse.json({ success: true, data: { ...mockDoctor, id: Number(params.id) } })
	),
	http.delete(`${API_BASE}/doctors/:id`, () => new HttpResponse(null, { status: 204 })),

	http.get(`${API_BASE}/specializations`, () =>
		HttpResponse.json({ success: true, data: [mockSpecialization] })
	),
	http.get(`${API_BASE}/specializations/:id`, ({ params }) =>
		HttpResponse.json({ ...mockSpecialization, id: Number(params.id) })
	),
	http.get(`${API_BASE}/specializations/code/:code`, ({ params }) =>
		HttpResponse.json({ ...mockSpecialization, code: String(params.code) })
	),
	http.post(`${API_BASE}/specializations`, async () => HttpResponse.json(mockSpecialization)),
	http.put(`${API_BASE}/specializations/:id`, async ({ params }) =>
		HttpResponse.json({ ...mockSpecialization, id: Number(params.id) })
	),
	http.delete(`${API_BASE}/specializations/:id`, () => new HttpResponse(null, { status: 204 })),

	http.get(`${API_BASE}/services`, () => HttpResponse.json([mockService])),
	http.get(`${API_BASE}/services/:id`, ({ params }) =>
		HttpResponse.json({ ...mockService, id: Number(params.id) })
	),
	http.post(`${API_BASE}/services`, async () => HttpResponse.json(mockService)),
	http.put(`${API_BASE}/services/:id`, async ({ params }) =>
		HttpResponse.json({ ...mockService, id: Number(params.id) })
	),
	http.delete(`${API_BASE}/services/:id`, () => new HttpResponse(null, { status: 204 })),
	http.put(`${API_BASE}/services/:id/specializations`, async ({ params }) =>
		HttpResponse.json({ ...mockService, id: Number(params.id) })
	),

	http.get(`${API_BASE}/patients`, () => HttpResponse.json({ success: true, data: [mockPatient] })),
	http.get(`${API_BASE}/patients/:id`, ({ params }) =>
		HttpResponse.json({ success: true, data: { ...mockPatient, id: Number(params.id) } })
	),
	http.post(`${API_BASE}/patients`, async () =>
		HttpResponse.json({ success: true, data: mockPatient })
	),
	http.put(`${API_BASE}/patients/:id`, async ({ params }) =>
		HttpResponse.json({ success: true, data: { ...mockPatient, id: Number(params.id) } })
	),
	http.delete(`${API_BASE}/patients/:id`, () => new HttpResponse(null, { status: 204 })),

	http.post(`${API_BASE}/notifications/login-credentials`, () =>
		HttpResponse.json({ success: true, message: "Письмо отправлено", data: null })
	),

	http.get(`${API_BASE}/appointments`, () =>
		HttpResponse.json({ success: true, data: [mockAppointment] })
	),
	http.get(`${API_BASE}/appointments/:id`, ({ params }) =>
		HttpResponse.json({ success: true, data: { ...mockAppointment, id: Number(params.id) } })
	),
	http.get(`${API_BASE}/appointments/doctor/:doctorId`, () =>
		HttpResponse.json({ success: true, data: [mockAppointment] })
	),
	http.get(`${API_BASE}/appointments/my/doctor`, () =>
		HttpResponse.json({ success: true, data: [mockAppointment] })
	),
	http.get(`${API_BASE}/appointments/patient/:patientId`, () =>
		HttpResponse.json({ success: true, data: [mockAppointment] })
	),
	http.get(`${API_BASE}/appointments/available`, () =>
		HttpResponse.json({ success: true, data: [] })
	),
	http.get(`${API_BASE}/appointments/available/dates`, () => HttpResponse.json(["2025-06-15"])),
	http.post(`${API_BASE}/appointments`, async () => HttpResponse.json(mockAppointment)),
	http.put(`${API_BASE}/appointments/:id`, async ({ params }) =>
		HttpResponse.json({ success: true, data: { ...mockAppointment, id: Number(params.id) } })
	),
	http.post(`${API_BASE}/appointments/book`, async () => HttpResponse.json(mockAppointment)),
	http.post(`${API_BASE}/appointments/:id/cancel`, async () =>
		HttpResponse.json({
			success: true,
			message: "Отменено",
			appointment: mockAppointment,
			queue: [],
		})
	),
	http.post(`${API_BASE}/appointments/:id/complete`, async () =>
		HttpResponse.json({
			success: true,
			message: "Завершено",
			appointment: { ...mockAppointment, status: "completed" },
			queue: [],
		})
	),
	http.delete(`${API_BASE}/appointments/:id`, () => new HttpResponse(null, { status: 204 })),
	http.post(`${API_BASE}/appointments/:id/send_notification`, () =>
		new HttpResponse(null, { status: 204 })
	),

	http.get(`${API_BASE}/diagnoses`, () => HttpResponse.json({ success: true, data: [mockDiagnosis] })),

	http.get(`${API_BASE}/schedules`, () => HttpResponse.json({ success: true, data: [mockSchedule] })),
	http.get(`${API_BASE}/schedules/:id`, ({ params }) =>
		HttpResponse.json({ success: true, data: { ...mockSchedule, id: Number(params.id) } })
	),
	http.get(`${API_BASE}/schedules/doctor/:doctorId`, () =>
		HttpResponse.json({ success: true, data: [mockSchedule] })
	),
	http.post(`${API_BASE}/schedules`, async () => HttpResponse.json(mockSchedule)),
	http.delete(`${API_BASE}/schedules/:id`, () => new HttpResponse(null, { status: 204 })),

	http.get(`${API_BASE}/queue/:id`, ({ params }) =>
		HttpResponse.json({ success: true, data: { ...mockQueue, id: Number(params.id) } })
	),
	http.get(`${API_BASE}/queue/doctor/:doctorId`, () =>
		HttpResponse.json({ success: true, data: [mockQueue] })
	),
	http.get(`${API_BASE}/queue/live/doctor/:doctorId`, () =>
		HttpResponse.json({ success: true, data: [mockQueue] })
	),
	http.post(`${API_BASE}/queue`, async () => HttpResponse.json(mockQueue)),
	http.delete(`${API_BASE}/queue/:id`, () => new HttpResponse(null, { status: 204 })),

	http.get(`${API_BASE}/reviews/:id`, ({ params }) =>
		HttpResponse.json({ success: true, data: { ...mockReview, id: Number(params.id) } })
	),
	http.get(`${API_BASE}/reviews/doctor/:doctorId`, () =>
		HttpResponse.json({ success: true, data: [mockReview] })
	),
	http.get(`${API_BASE}/reviews/appointment/:appointmentId`, () =>
		HttpResponse.json({ success: true, data: mockReview })
	),
	http.post(`${API_BASE}/reviews`, async () => HttpResponse.json(mockReview)),
	http.put(`${API_BASE}/reviews/:id`, async ({ params }) =>
		HttpResponse.json({ ...mockReview, id: Number(params.id) })
	),
	http.delete(`${API_BASE}/reviews/:id`, () => new HttpResponse(null, { status: 204 })),

	http.get(`${API_BASE}/rooms`, () => HttpResponse.json({ success: true, data: [mockRoom] })),
	http.get(`${API_BASE}/rooms/:id`, ({ params }) =>
		HttpResponse.json({ success: true, data: { ...mockRoom, id: Number(params.id) } })
	),
	http.post(`${API_BASE}/rooms`, async () =>
		HttpResponse.json({ success: true, data: mockRoom })
	),
	http.delete(`${API_BASE}/rooms/:id`, () => new HttpResponse(null, { status: 204 })),

	http.get(`${API_BASE}/reports/daily`, () => HttpResponse.json(mockDailyReport)),
	http.get(`${API_BASE}/reports/daily/doctor/:doctorId`, () =>
		HttpResponse.json(mockDailyReport)
	),
	http.get(`${API_BASE}/reports/range`, () => HttpResponse.json(mockDailyReport)),
	http.get(`${API_BASE}/reports/range/doctor/:doctorId`, () =>
		HttpResponse.json(mockDailyReport)
	),
];

export {
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
};
