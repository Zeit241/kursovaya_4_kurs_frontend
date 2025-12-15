import axios from "axios";
import type {
	User,
	Patient,
	Doctor,
	Specialization,
	Schedule,
	Appointment,
	AvailableAppointmentSlot,
	Queue,
	Review,
	Room,
	LoginRequest,
	LoginResponse,
	RegisterRequest,
	RegisterWithPatientRequest,
	RegisterResponse,
	CreateUserRequest,
	UpdateUserRequest,
	CreateDoctorRequest,
	UpdateDoctorRequest,
	CreateSpecializationRequest,
	UpdateSpecializationRequest,
	CreatePatientRequest,
	UpdatePatientRequest,
	CreateScheduleRequest,
	CreateAppointmentRequest,
	UpdateAppointmentRequest,
	BookAppointmentRequest,
	CreateQueueRequest,
	CreateReviewRequest,
	UpdateReviewRequest,
	CancelAppointmentRequest,
	CancelAppointmentResponse,
	CreateRoomRequest,
	ApiResponse,
	UserStats,
	DoctorsQueryParams,
} from "./types";

// Временный тип для отчетов (если DailyReport не определен в types.ts)
export interface DailyReport {
	date?: string;
	doctorId?: number;
	doctorDisplayName?: string | null;
	appointments?: any[];
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8085";

// Создаем базовый экземпляр axios с общими настройками
const axiosInstance = axios.create({
	baseURL: `${API_URL}/api`,
	headers: {
		"Content-Type": "application/json",
	},
});

// Интерцептор для добавления токена
axiosInstance.interceptors.request.use((config) => {
	const token = localStorage.getItem("token");
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

// Интерцептор для обработки ошибок
axiosInstance.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			localStorage.removeItem("token");
			localStorage.removeItem("user");
			window.location.href = "/login";
		}
		return Promise.reject(error);
	}
);

// ==================== АВТОРИЗАЦИЯ ====================

export const authApi = {
	login: async (data: LoginRequest): Promise<LoginResponse> => {
		const response = await axiosInstance.post<LoginResponse>("/auth/login", data);
		const isSuccess = response.data.success === true || response.data.status === 200;
		if (isSuccess && response.data.data?.token) {
			localStorage.setItem("token", response.data.data.token);
		}
		return response.data;
	},

	register: async (data: RegisterRequest): Promise<RegisterResponse> => {
		const response = await axiosInstance.post<RegisterResponse>("/auth/register", data);
		const isSuccess = response.data.success === true || response.data.status === 200;
		if (isSuccess && response.data.data?.token) {
			localStorage.setItem("token", response.data.data.token);
		}
		return response.data;
	},

	registerWithPatient: async (data: RegisterWithPatientRequest): Promise<RegisterResponse> => {
		const response = await axiosInstance.post<RegisterResponse>("/auth/register-with-patient", data);
		const isSuccess = response.data.success === true || response.data.status === 200;
		if (isSuccess && response.data.data?.token) {
			localStorage.setItem("token", response.data.data.token);
		}
		return response.data;
	},

	logout: () => {
		localStorage.removeItem("token");
		localStorage.removeItem("user");
	},
};

// ==================== ПОЛЬЗОВАТЕЛИ ====================

export const usersApi = {
	getAll: async (): Promise<User[]> => {
		const response = await axiosInstance.get<ApiResponse<User[]> | User[]>("/users");
		if (Array.isArray(response.data)) {
			return response.data;
		}
		const apiResponse = response.data as ApiResponse<User[]>;
		if (apiResponse && apiResponse.data) {
			return apiResponse.data;
		}
		return [];
	},

	getMe: async (): Promise<User> => {
		const response = await axiosInstance.get<ApiResponse<User>>("/users/me");
		if (response.data.data) {
			return response.data.data;
		}
		throw new Error(response.data.message || "Пользователь не найден");
	},

	getStats: async (): Promise<UserStats> => {
		const response = await axiosInstance.get<ApiResponse<UserStats>>("/users/userStats");
		if (response.data.data) {
			return response.data.data;
		}
		throw new Error(response.data.message || "Статистика не найдена");
	},

	getById: async (id: number): Promise<User> => {
		const response = await axiosInstance.get<User>(`/users/${id}`);
		return response.data;
	},

	create: async (data: CreateUserRequest): Promise<User> => {
		const response = await axiosInstance.post<User>("/users/create", data);
		return response.data;
	},

	update: async (id: number, data: UpdateUserRequest): Promise<User> => {
		const response = await axiosInstance.put<User>(`/users/${id}`, data);
		return response.data;
	},

	delete: async (id: number): Promise<void> => {
		await axiosInstance.delete(`/users/${id}`);
	},
};

// ==================== ВРАЧИ ====================

export const doctorsApi = {
	getAll: async (params?: DoctorsQueryParams): Promise<Doctor[]> => {
		const response = await axiosInstance.get<ApiResponse<Doctor[]> | Doctor[]>("/doctors", { params });
		// Проверяем, является ли ответ обёрнутым
		if (Array.isArray(response.data)) {
			return response.data;
		}
		// Если ответ обёрнутый (ApiResponse), извлекаем data
		const apiResponse = response.data as ApiResponse<Doctor[]>;
		if (apiResponse && apiResponse.data) {
			return apiResponse.data;
		}
		return [];
	},

	getById: async (id: number): Promise<Doctor> => {
		const response = await axiosInstance.get<ApiResponse<Doctor>>(`/doctors/${id}`);
		if (response.data.data) {
			return response.data.data;
		}
		throw new Error(response.data.message || "Врач не найден");
	},

	create: async (data: CreateDoctorRequest): Promise<Doctor> => {
		const response = await axiosInstance.post<ApiResponse<Doctor>>("/doctors/create", data);
		if (response.data.data) {
			return response.data.data;
		}
		throw new Error(response.data.message || "Ошибка при создании врача");
	},

	update: async (id: number, data: UpdateDoctorRequest): Promise<Doctor> => {
		const response = await axiosInstance.put<ApiResponse<Doctor>>(`/doctors/${id}`, data);
		if (response.data.data) {
			return response.data.data;
		}
		throw new Error(response.data.message || "Ошибка при обновлении врача");
	},

	delete: async (id: number): Promise<void> => {
		await axiosInstance.delete(`/doctors/${id}`);
	},
};

// ==================== СПЕЦИАЛИЗАЦИИ ====================

export const specializationsApi = {
	getAll: async (): Promise<Specialization[]> => {
		const response = await axiosInstance.get<ApiResponse<Specialization[]> | Specialization[]>("/specializations");
		if (Array.isArray(response.data)) {
			return response.data;
		}
		const apiResponse = response.data as ApiResponse<Specialization[]>;
		if (apiResponse && apiResponse.data) {
			return apiResponse.data;
		}
		return [];
	},

	getById: async (id: number): Promise<Specialization> => {
		const response = await axiosInstance.get<Specialization>(`/specializations/${id}`);
		return response.data;
	},

	getByCode: async (code: string): Promise<Specialization> => {
		const response = await axiosInstance.get<Specialization>(`/specializations/code/${code}`);
		return response.data;
	},

	create: async (data: CreateSpecializationRequest): Promise<Specialization> => {
		const response = await axiosInstance.post<Specialization>("/specializations", data);
		return response.data;
	},

	update: async (id: number, data: UpdateSpecializationRequest): Promise<Specialization> => {
		const response = await axiosInstance.put<Specialization>(`/specializations/${id}`, data);
		return response.data;
	},

	delete: async (id: number): Promise<void> => {
		await axiosInstance.delete(`/specializations/${id}`);
	},
};

// ==================== ПАЦИЕНТЫ ====================

export const patientsApi = {
	getAll: async (): Promise<Patient[]> => {
		const response = await axiosInstance.get<ApiResponse<Patient[]> | Patient[]>("/patients");
		if (Array.isArray(response.data)) {
			return response.data;
		}
		const apiResponse = response.data as ApiResponse<Patient[]>;
		if (apiResponse && apiResponse.data) {
			return apiResponse.data;
		}
		return [];
	},

	getById: async (id: number): Promise<Patient> => {
		const response = await axiosInstance.get<ApiResponse<Patient>>(`/patients/${id}`);
		if (response.data.data) {
			return response.data.data;
		}
		throw new Error(response.data.message || "Пациент не найден");
	},

	create: async (data: CreatePatientRequest): Promise<Patient> => {
		const response = await axiosInstance.post<ApiResponse<Patient>>("/patients", data);
		if (response.data.data) {
			return response.data.data;
		}
		throw new Error(response.data.message || "Ошибка при создании пациента");
	},

	update: async (id: number, data: UpdatePatientRequest): Promise<Patient> => {
		const response = await axiosInstance.put<ApiResponse<Patient>>(`/patients/${id}`, data);
		if (response.data.data) {
			return response.data.data;
		}
		throw new Error(response.data.message || "Ошибка при обновлении пациента");
	},

	delete: async (id: number): Promise<void> => {
		await axiosInstance.delete(`/patients/${id}`);
	},
};

// ==================== ЗАПИСИ НА ПРИЕМ ====================

export interface AppointmentsQueryParams {
	doctorId?: number;
	status?: string;
	date?: string; // YYYY-MM-DD
}

export const appointmentsApi = {
	getAll: async (params?: AppointmentsQueryParams): Promise<Appointment[]> => {
		const response = await axiosInstance.get<
			ApiResponse<Appointment[]> | Appointment[]
		>("/appointments", {
			params,
		});
		if (Array.isArray(response.data)) {
			return response.data;
		}
		const apiResponse = response.data as ApiResponse<Appointment[]>;
		if (apiResponse && apiResponse.data) {
			return apiResponse.data;
		}
		return [];
	},

	getById: async (id: number): Promise<Appointment> => {
		const response = await axiosInstance.get<ApiResponse<Appointment> | Appointment>(`/appointments/${id}`);
		if (response.data && typeof response.data === 'object' && 'id' in response.data && !('success' in response.data)) {
			return response.data as Appointment;
		}
		const apiResponse = response.data as ApiResponse<Appointment>;
		if (apiResponse && apiResponse.data) {
			return apiResponse.data;
		}
		throw new Error(apiResponse?.message || "Запись не найдена");
	},

	getByDoctor: async (doctorId: number): Promise<Appointment[]> => {
		const response = await axiosInstance.get<ApiResponse<Appointment[]> | Appointment[]>(`/appointments/doctor/${doctorId}`);
		if (Array.isArray(response.data)) {
			return response.data;
		}
		const apiResponse = response.data as ApiResponse<Appointment[]>;
		if (apiResponse && apiResponse.data) {
			return apiResponse.data;
		}
		return [];
	},

	getByPatient: async (patientId: number): Promise<Appointment[]> => {
		const response = await axiosInstance.get<ApiResponse<Appointment[]> | Appointment[]>(`/appointments/patient/${patientId}`);
		if (Array.isArray(response.data)) {
			return response.data;
		}
		const apiResponse = response.data as ApiResponse<Appointment[]>;
		if (apiResponse && apiResponse.data) {
			return apiResponse.data;
		}
		return [];
	},

	getAvailable: async (doctorId: number, date: string): Promise<AvailableAppointmentSlot[]> => {
		const response = await axiosInstance.get<ApiResponse<AvailableAppointmentSlot[]> | AvailableAppointmentSlot[]>("/appointments/available", {
			params: {
				doctorId,
				date,
			},
		});
		if (Array.isArray(response.data)) {
			return response.data;
		}
		const apiResponse = response.data as ApiResponse<AvailableAppointmentSlot[]>;
		if (apiResponse && apiResponse.data) {
			return apiResponse.data;
		}
		return [];
	},

	create: async (data: CreateAppointmentRequest): Promise<Appointment> => {
		const response = await axiosInstance.post<Appointment>("/appointments", data);
		return response.data;
	},

	update: async (
		id: number,
		data: UpdateAppointmentRequest
	): Promise<Appointment> => {
		const response = await axiosInstance.put<any>(
			`/appointments/${id}`,
			data
		);

		// Вариант 1: бекенд вернул «сырую» сущность приёма
		if (
			response.data &&
			typeof response.data === "object" &&
			"id" in response.data &&
			!("success" in response.data)
		) {
			return response.data as Appointment;
		}

		// Вариант 2: бекенд вернул объект вида { success, appointment, message }
		if (
			response.data &&
			typeof response.data === "object" &&
			"appointment" in response.data
		) {
			return (response.data as { appointment: Appointment }).appointment;
		}

		// Вариант 3: обёртка стандартного вида ApiResponse<T>
		const apiResponse = response.data as ApiResponse<Appointment>;
		if (apiResponse && apiResponse.data) {
			return apiResponse.data;
		}

		throw new Error(
			(apiResponse && apiResponse.message) ||
				"Ошибка при обновлении приёма"
		);
	},

	book: async (data: BookAppointmentRequest): Promise<Appointment> => {
		const response = await axiosInstance.post<Appointment>("/appointments/book", data);
		return response.data;
	},

	cancel: async (id: number, data?: CancelAppointmentRequest): Promise<CancelAppointmentResponse> => {
		const response = await axiosInstance.post<CancelAppointmentResponse>(`/appointments/${id}/cancel`, data || {});
		return response.data;
	},

	delete: async (id: number): Promise<void> => {
		await axiosInstance.delete(`/appointments/${id}`);
	},
};

// ==================== РАСПИСАНИЕ ====================

export const schedulesApi = {
	getAll: async (): Promise<Schedule[]> => {
		const response = await axiosInstance.get<ApiResponse<Schedule[]> | Schedule[]>("/schedules");
		if (Array.isArray(response.data)) {
			return response.data;
		}
		const apiResponse = response.data as ApiResponse<Schedule[]>;
		if (apiResponse && apiResponse.data) {
			return apiResponse.data;
		}
		return [];
	},

	getById: async (id: number): Promise<Schedule> => {
		const response = await axiosInstance.get<ApiResponse<Schedule> | Schedule>(`/schedules/${id}`);
		if (response.data && typeof response.data === 'object' && 'id' in response.data && !('success' in response.data)) {
			return response.data as Schedule;
		}
		const apiResponse = response.data as ApiResponse<Schedule>;
		if (apiResponse && apiResponse.data) {
			return apiResponse.data;
		}
		throw new Error(apiResponse?.message || "Расписание не найдено");
	},

	getByDoctor: async (doctorId: number): Promise<Schedule[]> => {
		const response = await axiosInstance.get<ApiResponse<Schedule[]> | Schedule[]>(`/schedules/doctor/${doctorId}`);
		if (Array.isArray(response.data)) {
			return response.data;
		}
		const apiResponse = response.data as ApiResponse<Schedule[]>;
		if (apiResponse && apiResponse.data) {
			return apiResponse.data;
		}
		return [];
	},

	create: async (data: CreateScheduleRequest): Promise<Schedule> => {
		const response = await axiosInstance.post<Schedule>("/schedules", data);
		return response.data;
	},

	delete: async (id: number): Promise<void> => {
		await axiosInstance.delete(`/schedules/${id}`);
	},
};

// ==================== ОЧЕРЕДЬ ====================

export const queueApi = {
	getById: async (id: number): Promise<Queue> => {
		const response = await axiosInstance.get<ApiResponse<Queue> | Queue>(`/queue/${id}`);
		if (response.data && typeof response.data === 'object' && 'id' in response.data && !('success' in response.data)) {
			return response.data as Queue;
		}
		const apiResponse = response.data as ApiResponse<Queue>;
		if (apiResponse && apiResponse.data) {
			return apiResponse.data;
		}
		throw new Error(apiResponse?.message || "Запись очереди не найдена");
	},

	getByDoctor: async (doctorId: number): Promise<Queue[]> => {
		const response = await axiosInstance.get<ApiResponse<Queue[]> | Queue[]>(`/queue/doctor/${doctorId}`);
		if (Array.isArray(response.data)) {
			return response.data;
		}
		const apiResponse = response.data as ApiResponse<Queue[]>;
		if (apiResponse && apiResponse.data) {
			return apiResponse.data;
		}
		return [];
	},

	create: async (data: CreateQueueRequest): Promise<Queue> => {
		const response = await axiosInstance.post<Queue>("/queue", data);
		return response.data;
	},

	delete: async (id: number): Promise<void> => {
		await axiosInstance.delete(`/queue/${id}`);
	},
};

// ==================== ОТЗЫВЫ ====================

export const reviewsApi = {
	getById: async (id: number): Promise<Review> => {
		const response = await axiosInstance.get<ApiResponse<Review> | Review>(`/reviews/${id}`);
		if (response.data && typeof response.data === 'object' && 'id' in response.data && !('success' in response.data)) {
			return response.data as Review;
		}
		const apiResponse = response.data as ApiResponse<Review>;
		if (apiResponse && apiResponse.data) {
			return apiResponse.data;
		}
		throw new Error(apiResponse?.message || "Отзыв не найден");
	},

	getByDoctor: async (doctorId: number): Promise<Review[]> => {
		const response = await axiosInstance.get<ApiResponse<Review[]> | Review[]>(`/reviews/doctor/${doctorId}`);
		if (Array.isArray(response.data)) {
			return response.data;
		}
		const apiResponse = response.data as ApiResponse<Review[]>;
		if (apiResponse && apiResponse.data) {
			return apiResponse.data;
		}
		return [];
	},

	getByAppointment: async (appointmentId: number): Promise<Review> => {
		const response = await axiosInstance.get<ApiResponse<Review> | Review>(`/reviews/appointment/${appointmentId}`);
		if (response.data && typeof response.data === 'object' && 'id' in response.data && !('success' in response.data)) {
			return response.data as Review;
		}
		const apiResponse = response.data as ApiResponse<Review>;
		if (apiResponse && apiResponse.data) {
			return apiResponse.data;
		}
		throw new Error(apiResponse?.message || "Отзыв не найден");
	},

	create: async (data: CreateReviewRequest): Promise<Review> => {
		const response = await axiosInstance.post<Review>("/reviews", data);
		return response.data;
	},

	update: async (id: number, data: UpdateReviewRequest): Promise<Review> => {
		const response = await axiosInstance.put<Review>(`/reviews/${id}`, data);
		return response.data;
	},

	delete: async (id: number): Promise<void> => {
		await axiosInstance.delete(`/reviews/${id}`);
	},
};

// ==================== КАБИНЕТЫ ====================

export const roomsApi = {
	getAll: async (): Promise<Room[]> => {
		const response = await axiosInstance.get<ApiResponse<Room[]> | Room[]>("/rooms");
		if (Array.isArray(response.data)) {
			return response.data;
		}
		const apiResponse = response.data as ApiResponse<Room[]>;
		if (apiResponse && apiResponse.data) {
			return apiResponse.data;
		}
		return [];
	},

	getById: async (id: number): Promise<Room> => {
		const response = await axiosInstance.get<ApiResponse<Room> | Room>(`/rooms/${id}`);
		if (response.data && typeof response.data === 'object' && 'id' in response.data && !('success' in response.data)) {
			return response.data as Room;
		}
		const apiResponse = response.data as ApiResponse<Room>;
		if (apiResponse && apiResponse.data) {
			return apiResponse.data;
		}
		throw new Error(apiResponse?.message || "Кабинет не найден");
	},

	create: async (data: CreateRoomRequest): Promise<Room> => {
		const response = await axiosInstance.post<ApiResponse<Room> | Room>("/rooms", data);
		if (response.data && typeof response.data === 'object' && 'id' in response.data && !('success' in response.data)) {
			return response.data as Room;
		}
		const apiResponse = response.data as ApiResponse<Room>;
		if (apiResponse && apiResponse.data) {
			return apiResponse.data;
		}
		throw new Error(apiResponse?.message || "Ошибка при создании кабинета");
	},

	delete: async (id: number): Promise<void> => {
		await axiosInstance.delete(`/rooms/${id}`);
	},
};

// ==================== ОТЧЕТЫ ====================

export const reportsApi = {
	// Получить отчет за день
	getDaily: async (date: string): Promise<DailyReport> => {
		const response = await axiosInstance.get<DailyReport>("/reports/daily", {
			params: { date },
		});
		return response.data;
	},

	// Получить отчет за день по врачу
	getDailyByDoctor: async (doctorId: number, date: string): Promise<DailyReport> => {
		const response = await axiosInstance.get<DailyReport>(`/reports/daily/doctor/${doctorId}`, {
			params: { date },
		});
		return response.data;
	},

	// Получить отчет за период
	getRange: async (startDate: string, endDate: string): Promise<DailyReport> => {
		const response = await axiosInstance.get<DailyReport>("/reports/range", {
			params: { startDate, endDate },
		});
		return response.data;
	},

	// Получить отчет за период по врачу
	getRangeByDoctor: async (doctorId: number, startDate: string, endDate: string): Promise<DailyReport> => {
		const response = await axiosInstance.get<DailyReport>(`/reports/range/doctor/${doctorId}`, {
			params: { startDate, endDate },
		});
		return response.data;
	},

	// Экспорт в Excel за день
	exportDailyExcel: async (date: string): Promise<Blob> => {
		const response = await axiosInstance.get(`/reports/daily/excel`, {
			params: { date },
			responseType: "blob",
		});
		return response.data;
	},

	// Экспорт в PDF за день
	exportDailyPdf: async (date: string): Promise<Blob> => {
		const response = await axiosInstance.get(`/reports/daily/pdf`, {
			params: { date },
			responseType: "blob",
		});
		return response.data;
	},

	// Экспорт в Excel за день по врачу
	exportDailyExcelByDoctor: async (doctorId: number, date: string): Promise<Blob> => {
		const response = await axiosInstance.get(`/reports/daily/doctor/${doctorId}/excel`, {
			params: { date },
			responseType: "blob",
		});
		return response.data;
	},

	// Экспорт в PDF за день по врачу
	exportDailyPdfByDoctor: async (doctorId: number, date: string): Promise<Blob> => {
		const response = await axiosInstance.get(`/reports/daily/doctor/${doctorId}/pdf`, {
			params: { date },
			responseType: "blob",
		});
		return response.data;
	},

	// Экспорт в Excel за период
	exportRangeExcel: async (startDate: string, endDate: string): Promise<Blob> => {
		const response = await axiosInstance.get(`/reports/range/excel`, {
			params: { startDate, endDate },
			responseType: "blob",
		});
		return response.data;
	},

	// Экспорт в PDF за период
	exportRangePdf: async (startDate: string, endDate: string): Promise<Blob> => {
		const response = await axiosInstance.get(`/reports/range/pdf`, {
			params: { startDate, endDate },
			responseType: "blob",
		});
		return response.data;
	},

	// Экспорт в Excel за период по врачу
	exportRangeExcelByDoctor: async (doctorId: number, startDate: string, endDate: string): Promise<Blob> => {
		const response = await axiosInstance.get(`/reports/range/doctor/${doctorId}/excel`, {
			params: { startDate, endDate },
			responseType: "blob",
		});
		return response.data;
	},

	// Экспорт в PDF за период по врачу
	exportRangePdfByDoctor: async (doctorId: number, startDate: string, endDate: string): Promise<Blob> => {
		const response = await axiosInstance.get(`/reports/range/doctor/${doctorId}/pdf`, {
			params: { startDate, endDate },
			responseType: "blob",
		});
		return response.data;
	},
};

export default axiosInstance;
