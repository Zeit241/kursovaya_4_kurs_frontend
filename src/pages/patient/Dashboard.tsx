import { CalendarDays, Clock, FileText, Loader2, User } from "lucide-react";
import { Link } from "react-router-dom";

import { Appointment } from "@/api/types";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { formatClinicServicePriceFromFields } from "@/lib/format-clinic-service-price";
import {
	appointmentDoctorName,
	appointmentDoctorSpecialty,
	appointmentRoomName,
} from "@/lib/appointment-display";
import {
	formatAppointmentDate,
	formatAppointmentTime,
	appointmentTimeMs,
} from "@/lib/appointment-time";
import { useMemo } from "react";

import {
	useCancelAppointmentMutation,
	useGetAppointmentsByPatientQuery,
} from "@/store/api/apiSlice";

export default function PatientDashboard() {
	const { user } = useAuth();
	const patientId = user?.patientId;
	const { data: allAppointments = [], isLoading, isError, refetch } = useGetAppointmentsByPatientQuery(
		patientId!,
		{ skip: !patientId }
	);

	const error = !user?.patientId
		? "Пользователь не является пациентом"
		: isError
			? "Ошибка при загрузке приёмов"
			: null;

	const upcomingAppointments = useMemo(() => {
		if (!patientId) return [] as Appointment[];
		const now = Date.now();
		return allAppointments.filter((apt) => {
			return appointmentTimeMs(apt.startTime) > now && apt.status === "scheduled";
		});
	}, [allAppointments, patientId]);

	return (
		<div className="flex flex-1  flex-col">
			<main className="py-8">
				<div className="container mx-auto px-4">
					<div className="mb-8 fade-in">
						<h2 className="text-3xl font-bold gradient-heading">
							Добро пожаловать, {user?.firstName}!
						</h2>
						<p className="mt-2 text-muted-foreground">
							Управляйте своими медицинскими записями и
							записывайтесь на приём онлайн
						</p>
					</div>

					<div className="mb-8 slide-up">
						<Card className="gradient-card overflow-hidden hover-glow">
							<div className="h-1 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-teal-500"></div>
							<CardHeader>
								<CardTitle className="text-xl">
									Ближайший приём
								</CardTitle>
								<CardDescription>
									Информация о вашем следующем визите
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								{!isLoading &&
									upcomingAppointments?.map((appointment) => {
										// Преобразуем данные для отображения
										const appointmentData = {
											id: appointment.id,
											doctor_name: appointmentDoctorName(appointment),
											doctor_specialty:
												appointmentDoctorSpecialty(appointment) ||
												"Специальность не указана",
											office_number: appointmentRoomName(appointment),
											appointment_date: formatAppointmentDate(
												appointment.startTime,
												"yyyy-MM-dd"
											),
											appointment_time: formatAppointmentTime(appointment.startTime),
											service_name: appointment.service?.name ?? null,
											service_price_label: appointment.service
												? formatClinicServicePriceFromFields(appointment.service.price)
												: null,
										};
										return (
											<AppointmentCard
												key={appointment.id}
												appointment={appointmentData as any}
												onCancel={() => void refetch()}
											/>
										);
									})}
								{isLoading && (
									<div className="flex items-center justify-center">
										<Loader2 className="h-5 w-5 animate-spin" />
									</div>
								)}
								{!isLoading && error && (
									<div className="flex items-center justify-center">
										<p className="text-red-500">
											Ошибка при загрузке приемов
										</p>
									</div>
								)}

								{!isLoading &&
									upcomingAppointments?.length === 0 && (
										<div className="flex items-center justify-center pb-4">
											<p className="text-muted-foreground">
												Нет ближайших приемов
											</p>
										</div>
									)}
							</CardContent>
						</Card>
					</div>

					<div className="grid gap-6 md:grid-cols-3">
						<Card className="gradient-card overflow-hidden light-card-hover slide-up stagger-1 hover-lift">
							<div className="h-1 w-full bg-gradient-to-r from-blue-500 to-indigo-500"></div>
							<CardHeader className="pb-2">
								<CardTitle className="flex items-center gap-2">
									<CalendarDays className="h-5 w-5 text-blue-600" />
									Мои приёмы
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="mb-4 text-muted-foreground">
									Просмотр истории и предстоящих приёмов
								</p>
								<Button
									asChild
									className="w-full bg-slate-100 text-slate-800 hover:bg-slate-200 hover-scale"
								>
									<Link to="/patient/appointments">
										Просмотреть приёмы
									</Link>
								</Button>
							</CardContent>
						</Card>

						<Card className="gradient-card overflow-hidden light-card-hover slide-up stagger-2 hover-lift">
							<div className="h-1 w-full bg-gradient-to-r from-indigo-500 to-purple-500"></div>
							<CardHeader className="pb-2">
								<CardTitle className="flex items-center gap-2">
									<FileText className="h-5 w-5 text-purple-600" />
									Запись на приём
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="mb-4 text-muted-foreground">
									Запишитесь на приём к нужному специалисту
								</p>
								<Button
									asChild
									className="w-full gradient-button"
								>
									<Link to="/patient/book">
										Записаться на приём
									</Link>
								</Button>
							</CardContent>
						</Card>

						<Card className="gradient-card overflow-hidden light-card-hover slide-up stagger-3 hover-lift">
							<div className="h-1 w-full bg-gradient-to-r from-purple-500 to-teal-500"></div>
							<CardHeader className="pb-2">
								<CardTitle className="flex items-center gap-2">
									<User className="h-5 w-5 text-teal-600" />
									Мой профиль
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="mb-4 text-muted-foreground">
									Управление личными данными и настройками
								</p>
								<Button
									asChild
									className="w-full bg-slate-100 text-slate-800 hover:bg-slate-200 hover-scale"
								>
									<Link to="/patient/profile">
										Просмотреть профиль
									</Link>
								</Button>
							</CardContent>
						</Card>
					</div>
				</div>
			</main>
		</div>
	);
}

export function AppointmentCard({
	appointment,
	onCancel,
}: {
	appointment: {
		id: number;
		doctor_specialty: string;
		doctor_name: string;
		office_number: string;
		appointment_date: string;
		appointment_time: string;
		service_name?: string | null;
		service_price_label?: string | null;
	};
	onCancel?: () => void;
}) {
	const [cancelAppointmentMut] = useCancelAppointmentMutation();
	const cancelAppointment = async (appointmentId: number) => {
		try {
			await cancelAppointmentMut({ id: appointmentId, body: {} }).unwrap();
			onCancel?.();
		} catch (err) {
			console.error("Error canceling appointment:", err);
		}
	};
	return (
		<div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div className="flex items-center gap-4">
					<div className="rounded-full bg-blue-100 p-3 text-blue-600 pulse">
						<CalendarDays className="h-6 w-6" />
					</div>
					<div>
						<h3 className="text-lg font-medium">
							{appointment.doctor_specialty} -{" "}
							{appointment.doctor_name}
						</h3>
						<p className="text-muted-foreground">
							{appointment.office_number}
						</p>
						{appointment.service_name ? (
							<p className="mt-1 text-sm text-muted-foreground">
								Услуга:{" "}
								<span className="font-medium text-foreground">
									{appointment.service_name}
								</span>
								{appointment.service_price_label &&
								appointment.service_price_label !== "—" ? (
									<>
										{" "}
										<span className="font-semibold text-foreground">
											{appointment.service_price_label}
										</span>
									</>
								) : (
									<span className="text-muted-foreground">
										{" "}
										(стоимость уточняйте в клинике)
									</span>
								)}
							</p>
						) : null}
					</div>
				</div>
				<div className="flex flex-col items-start md:items-end">
					<div className="flex items-center gap-2">
						<Clock className="h-4 w-4 text-blue-600" />
						<span className="text-lg font-medium">
							{new Date(
								appointment.appointment_date
							).toLocaleString("ru-RU", {
								day: "2-digit",
								month: "long",
								year: "numeric",
							})}
							{"  "}
							{appointment.appointment_time}
						</span>
					</div>
					<div className="mt-2 flex gap-2">
						<Button
							onClick={() => cancelAppointment(appointment.id)}
							variant="outline"
							size="sm"
							className="border-slate-300 hover:bg-slate-100 hover-scale"
						>
							Отменить
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
