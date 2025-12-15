import { format, isPast } from "date-fns";
import { ru } from "date-fns/locale";
import {
	ArrowLeft,
	Calendar,
	Clock,
	FileText,
	Loader2,
	MapPin,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { appointmentsApi, usersApi } from "@/api/client";
import { Appointment } from "@/api/types";
import { AppointmentDetailsDialog } from "@/components/appointment-details-dialog";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function PatientAppointmentsPage() {
	const { user } = useAuth();
	const [appointments, setAppointments] = useState<Appointment[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
	const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

	useEffect(() => {
		if (user?.id) {
			fetchAppointments();
		}
	}, [user]);

	const fetchAppointments = async () => {
		if (!user?.id) return;
		try {
			setIsLoading(true);
			setError(null);
			// Получаем данные пользователя для получения patientId
			const userData = await usersApi.getMe();
			if (!userData.patientId) {
				setError("Пользователь не является пациентом");
				toast.error("Не удалось найти данные пациента");
				return;
			}
			// Получаем записи по patientId
			const response = await appointmentsApi.getByPatient(userData.patientId);
			setAppointments(response || []);
		} catch (err) {
			setError("Ошибка при загрузке приёмов");
			toast.error("Не удалось загрузить приёмы");
		} finally {
			setIsLoading(false);
		}
	};

	const handleCancelAppointment = async (appointmentId: number) => {
		try {
			await appointmentsApi.cancel(appointmentId);
			toast.success("Приём успешно отменён");
			fetchAppointments(); // Обновляем список приёмов
		} catch (err) {
			toast.error("Не удалось отменить приём");
		}
	};

	// Разделяем приёмы на предстоящие и прошедшие
	const upcomingAppointments = appointments.filter(
		(appointment) => {
			const isFuture = !isPast(new Date(appointment.startTime));
			const isActive = ["scheduled", "confirmed", "in_progress"].includes(appointment.status);
			return isFuture && isActive;
		}
	);

	const pastAppointments = appointments.filter(
		(appointment) => {
			const isPastAppointment = isPast(new Date(appointment.startTime));
			const isCompleted = ["completed", "cancelled", "no_show"].includes(appointment.status);
			return isPastAppointment || isCompleted;
		}
	);

	return (
		<div className="flex min-h-screen flex-col gradient-bg">
			<main className="flex-1 py-8">
				<div className="container mx-auto px-4">
					<div className="mb-8 fade-in">
						<Button
							variant="ghost"
							asChild
							className="mb-2 hover:bg-slate-100 hover-scale"
						>
							<Link to="/patient">
								<ArrowLeft className="mr-2 h-4 w-4" />
								Назад на главную
							</Link>
						</Button>
						<h2 className="text-3xl font-bold gradient-heading">
							Мои приёмы
						</h2>
						<p className="mt-2 text-slate-600">
							История и предстоящие приёмы
						</p>
					</div>

					<Tabs defaultValue="upcoming" className="mb-8 slide-up">
						<TabsList className="grid w-full grid-cols-2 bg-slate-100">
							<TabsTrigger value="upcoming">
								Предстоящие
							</TabsTrigger>
							<TabsTrigger value="past">История</TabsTrigger>
						</TabsList>
						<TabsContent value="upcoming" className="mt-6">
							{isLoading ? (
								<div className="flex justify-center py-8">
									<Loader2 className="h-8 w-8 animate-spin text-blue-600" />
								</div>
							) : error ? (
								<div className="text-center text-red-600 py-8">
									{error}
								</div>
							) : upcomingAppointments.length === 0 ? (
								<div className="text-center text-slate-600 py-8">
									У вас нет предстоящих приёмов
								</div>
							) : (
								<div className="space-y-6">
									{upcomingAppointments.map(
										(appointment, index) => (
											<AppointmentCard
												key={appointment.id}
												date={format(
													new Date(appointment.startTime),
													"d MMMM yyyy",
													{ locale: ru }
												)}
												time={format(
													new Date(appointment.startTime),
													"HH:mm"
												)}
												doctor={
													appointment.doctor?.displayName ||
													`${appointment.doctor?.user?.lastName || ""} ${appointment.doctor?.user?.firstName || ""}`.trim() ||
													"Врач не указан"
												}
												specialty={
													appointment.doctor?.specialization ||
													"Специальность не указана"
												}
												room={
													appointment.room?.code ||
													appointment.room?.name ||
													"Не указан"
												}
												status={appointment.status as "scheduled" | "completed" | "cancelled"}
												animationDelay={`stagger-${
													index + 1
												}`}
												onCancel={() =>
													handleCancelAppointment(
														appointment.id
													)
												}
											/>
										)
									)}
								</div>
							)}
						</TabsContent>
						<TabsContent value="past" className="mt-6">
							{isLoading ? (
								<div className="flex justify-center py-8">
									<Loader2 className="h-8 w-8 animate-spin text-blue-600" />
								</div>
							) : error ? (
								<div className="text-center text-red-600 py-8">
									{error}
								</div>
							) : pastAppointments.length === 0 ? (
								<div className="text-center text-slate-600 py-8">
									У вас нет завершённых приёмов
								</div>
							) : (
								<div className="space-y-6">
									{pastAppointments.map(
										(appointment, index) => (
											<AppointmentCard
												key={appointment.id}
												appointment={appointment}
												date={format(
													new Date(appointment.startTime),
													"d MMMM yyyy",
													{ locale: ru }
												)}
												time={format(
													new Date(appointment.startTime),
													"HH:mm"
												)}
												doctor={
													appointment.doctor?.displayName ||
													`${appointment.doctor?.user?.lastName || ""} ${appointment.doctor?.user?.firstName || ""}`.trim() ||
													"Врач не указан"
												}
												specialty={
													appointment.doctor?.specializations?.[0]?.name ||
													"Специальность не указана"
												}
												room={
													appointment.room?.code ||
													appointment.room?.name ||
													"Не указан"
												}
												status={
													appointment.status === "completed"
														? "completed"
														: appointment.status === "cancelled"
														? "cancelled"
														: "completed"
												}
												animationDelay={`stagger-${
													index + 1
												}`}
												onViewDetails={() => {
													if (appointment) {
														setSelectedAppointment(appointment);
														setIsDetailsDialogOpen(true);
													}
												}}
											/>
										)
									)}
								</div>
							)}
						</TabsContent>
					</Tabs>

					<div className="flex justify-center slide-up stagger-5">
						<Button asChild className="gradient-button hover-scale">
							<Link to="/patient/book">
								Записаться на новый приём
							</Link>
						</Button>
					</div>
				</div>
			</main>
			<Footer />
			<AppointmentDetailsDialog
				appointment={selectedAppointment}
				open={isDetailsDialogOpen}
				onOpenChange={setIsDetailsDialogOpen}
				onUpdate={fetchAppointments}
				isPatientView={true}
			/>
		</div>
	);
}

interface AppointmentCardProps {
	appointment?: Appointment;
	date: string;
	time: string;
	doctor: string;
	specialty: string;
	room: string;
	status: "scheduled" | "completed" | "cancelled";
	animationDelay?: string;
	onCancel?: () => void;
	onViewDetails?: () => void;
}

function AppointmentCard({
	appointment: _appointment,
	date,
	time,
	doctor,
	specialty,
	room,
	status,
	animationDelay,
	onCancel,
	onViewDetails,
}: AppointmentCardProps) {
	return (
		<Card
			className={`gradient-card overflow-hidden slide-up ${animationDelay} hover-lift`}
		>
			<div
				className={`h-1 w-full ${
					status === "scheduled"
						? "bg-gradient-to-r from-blue-500 to-purple-500"
						: status === "completed"
						? "bg-gradient-to-r from-emerald-500 to-teal-500"
						: "bg-gradient-to-r from-red-500 to-orange-500"
				}`}
			></div>
			<CardContent className="p-6">
				<div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
					<div className="flex flex-col gap-4 md:flex-row md:items-center">
						<div
							className={`rounded-full p-3 ${
								status === "scheduled"
									? "bg-blue-100 text-blue-600"
									: status === "completed"
									? "bg-emerald-100 text-emerald-600"
									: "bg-red-100 text-red-600"
							} ${status === "scheduled" ? "pulse" : ""}`}
						>
							{status === "scheduled" ? (
								<Calendar className="h-6 w-6" />
							) : status === "completed" ? (
								<FileText className="h-6 w-6" />
							) : (
								<Calendar className="h-6 w-6" />
							)}
						</div>
						<div>
							<div className="flex items-center gap-2">
								<Badge
									className={
										status === "scheduled"
											? "status-badge-upcoming"
											: status === "completed"
											? "status-badge-completed"
											: "status-badge-canceled"
									}
								>
									{status === "scheduled"
										? "Запланировано"
										: status === "completed"
										? "Завершено"
										: "Отменено"}
								</Badge>
							</div>
							<h3 className="mt-2 text-lg font-medium">
								{specialty} - {doctor}
							</h3>
							<div className="mt-2 flex flex-col gap-1 text-sm text-slate-600">
								<div className="flex items-center gap-1">
									<Clock className="h-4 w-4" />
									<span>
										{date}, {time}
									</span>
								</div>
								<div className="flex items-center gap-1">
									<MapPin className="h-4 w-4" />
									<span>Кабинет {room}</span>
								</div>
							</div>
						</div>
					</div>
					<div className="flex flex-wrap gap-2">
						{status === "scheduled" ? (
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button
										variant="outline"
										size="sm"
										className="border-slate-300 hover:bg-slate-100 hover-scale"
									>
										Отменить
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>
											Отмена приёма
										</AlertDialogTitle>
										<AlertDialogDescription>
											Вы уверены, что хотите отменить
											приём к {doctor} ({specialty}) на{" "}
											{date} в {time}? Это действие нельзя
											будет отменить.
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>
											Нет, оставить
										</AlertDialogCancel>
										<AlertDialogAction
											onClick={onCancel}
											className="bg-red-500 hover:bg-red-600"
										>
											Да, отменить
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						) : (
							<Button
								variant="outline"
								size="sm"
								className="border-slate-300 hover:bg-slate-100 hover-scale"
								onClick={onViewDetails}
							>
								Просмотреть детали
							</Button>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
