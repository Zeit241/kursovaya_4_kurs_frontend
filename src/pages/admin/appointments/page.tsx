"use client";

import { appointmentsApi, doctorsApi, patientsApi } from "@/api/client";
import { Appointment, Doctor, Patient } from "@/api/types";
import { AppointmentDetailsDialog } from "@/components/appointment-details-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const statusLabels: Record<string, string> = {
	scheduled: "Запланирован",
	confirmed: "Подтвержден",
	in_progress: "В процессе",
	completed: "Завершен",
	cancelled: "Отменен",
	no_show: "Неявка",
	available: "Доступно",
};

export default function AppointmentsPage() {
	const [appointments, setAppointments] = useState<Appointment[]>([]);
	const [doctors, setDoctors] = useState<Doctor[]>([]);
	const [patients, setPatients] = useState<Patient[]>([]);
	const [loading, setLoading] = useState(true);
	const [filters, setFilters] = useState({
		date: "",
		doctor: "all",
		status: "all",
	});
	const [selectedAppointment, setSelectedAppointment] =
		useState<Appointment | null>(null);
	const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
	
	// Добавляем состояние для пагинации
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalCount, setTotalCount] = useState(0);
	const itemsPerPage = 10;

	// Загрузка списка врачей
	const loadDoctors = async () => {
		try {
			const response = await doctorsApi.getAll();
			setDoctors(Array.isArray(response) ? response : []);
		} catch (error) {
			console.error("Ошибка при загрузке списка врачей:", error);
			toast.error("Не удалось загрузить список врачей");
			setDoctors([]);
		}
	};

	// Загрузка списка пациентов
	const loadPatients = async () => {
		try {
			const response = await patientsApi.getAll();
			setPatients(Array.isArray(response) ? response : []);
		} catch (error) {
			console.error("Ошибка при загрузке списка пациентов:", error);
			setPatients([]);
		}
	};

	// Загрузка приемов
	const loadAppointments = async (page: number = 1) => {
		try {
			setLoading(true);
			const params: any = {};

			if (filters.doctor && filters.doctor !== "all") {
				params.doctorId = Number(filters.doctor);
			}
			if (filters.date) {
				// backend ожидает формат YYYY-MM-DD
				params.date = filters.date;
			}
			if (filters.status && filters.status !== "all") {
				params.status = filters.status;
			}

			const response = await appointmentsApi.getAll(params);
			let appointmentsList = Array.isArray(response) ? response : [];

			// Не показываем записи без пациента
			appointmentsList = appointmentsList.filter(
				(appointment) => appointment.patientId != null
			);

			// Пагинация на фронтенде
			const startIndex = (page - 1) * itemsPerPage;
			const paginated = appointmentsList.slice(
				startIndex,
				startIndex + itemsPerPage
			);

			setAppointments(paginated);
			setTotalCount(appointmentsList.length);
			setTotalPages(Math.max(1, Math.ceil(appointmentsList.length / itemsPerPage)));
			setCurrentPage(page);
		} catch (error) {
			console.error("Ошибка при загрузке приемов:", error);
			toast.error("Не удалось загрузить список приемов");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadDoctors();
		loadPatients();
		loadAppointments(currentPage);
	}, [currentPage]);

	const handleFilterChange = (field: string, value: string) => {
		setFilters((prev) => ({ ...prev, [field]: value }));
	};

	const applyFilters = () => {
		setCurrentPage(1); // Сбрасываем на первую страницу при применении фильтров
		loadAppointments(1);
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center h-96">
				Загрузка...
			</div>
		);
	}

	return (
		<div className="flex flex-1 flex-col gradient-bg">
			<main className="py-8">
				<div className="container mx-auto px-4">
					<div className="mb-8 flex items-center justify-between">
						<h2 className="text-3xl font-bold gradient-heading">
							Приёмы
						</h2>
					</div>

					<Card className="mb-6 gradient-card">
						<CardHeader>
							<CardTitle>Фильтры</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid gap-4 md:grid-cols-3">
								<div>
									<Label htmlFor="date">Дата</Label>
									<Input
										id="date"
										type="date"
										className="mt-1 border-slate-700"
										value={filters.date}
										onChange={(e) =>
											handleFilterChange(
												"date",
												e.target.value
											)
										}
									/>
								</div>
								<div>
									<Label htmlFor="doctor">Врач</Label>
									<Select
										value={filters.doctor}
										onValueChange={(value) =>
											handleFilterChange("doctor", value)
										}
									>
										<SelectTrigger
											id="doctor"
											className="mt-1 border-slate-700"
										>
											<SelectValue placeholder="Все врачи" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">
												Все врачи
											</SelectItem>
											{doctors && doctors.length > 0 && doctors.map((doctor) => (
												<SelectItem
													key={doctor.id}
													value={doctor.id.toString()}
												>
													{doctor.user.lastName}{" "}
													{doctor.user.firstName}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div>
									<Label htmlFor="status">Статус</Label>
									<Select
										value={filters.status}
										onValueChange={(value) =>
											handleFilterChange("status", value)
										}
									>
										<SelectTrigger
											id="status"
											className="mt-1 border-slate-700"
										>
											<SelectValue placeholder="Все статусы" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">
												Все статусы
											</SelectItem>
											<SelectItem value="scheduled">
												Запланирован
											</SelectItem>
											<SelectItem value="completed">
												Завершен
											</SelectItem>
											<SelectItem value="cancelled">
												Отменен
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
							<Button
								className="mt-4 gradient-button"
								onClick={applyFilters}
							>
								Применить фильтры
							</Button>
						</CardContent>
					</Card>

					<Card className="gradient-card">
						<CardContent className="p-0">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Дата и время</TableHead>
										<TableHead>Пациент</TableHead>
										<TableHead>Врач</TableHead>
										<TableHead>Специальность</TableHead>
										<TableHead>Кабинет</TableHead>
										<TableHead>Статус</TableHead>
										<TableHead>Действия</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{loading ? (
										<TableRow>
											<TableCell
												colSpan={7}
												className="text-center py-8"
											>
												<div className="flex items-center justify-center gap-2">
													<div className="w-4 h-4 rounded-full border-2 border-t-transparent border-blue-500 animate-spin"></div>
													Загрузка данных...
												</div>
											</TableCell>
										</TableRow>
									) : appointments.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={7}
												className="text-center py-8"
											>
												Записи на приём отсутствуют
											</TableCell>
										</TableRow>
									) : (
										appointments.map((appointment) => {
											const doctor = doctors.find(d => d.id === appointment.doctorId);
											const patient = patients.find(p => p.id === appointment.patientId);
											
											return (
												<TableRow key={appointment.id}>
													<TableCell className="font-medium">
														{format(
															new Date(appointment.startTime),
															"dd.MM.yyyy HH:mm"
														)}
													</TableCell>
													<TableCell>
														{patient ? (
															<>
																{patient.user.lastName}{" "}
																{patient.user.firstName}{" "}
																{patient.user.middleName}
															</>
														) : (
															appointment.patientId ? `Пациент ID: ${appointment.patientId}` : "-"
														)}
													</TableCell>
													<TableCell>
														{doctor ? (
															<>
																{doctor.user.lastName}{" "}
																{doctor.user.firstName}{" "}
																{doctor.user.middleName}
															</>
														) : (
															`Врач ID: ${appointment.doctorId}`
														)}
													</TableCell>
													<TableCell>
														{doctor && doctor.specializations.length > 0 ? (
															<div className="flex flex-wrap gap-1">
																{doctor.specializations.map((spec) => (
																	<span
																		key={spec.id}
																		className="px-2 py-1 rounded-full text-xs border border-slate-700"
																	>
																		{spec.name}
																	</span>
																))}
															</div>
														) : (
															<span className="text-slate-400">-</span>
														)}
													</TableCell>
													<TableCell>
														{appointment.roomId || "-"}
													</TableCell>
												<TableCell>
													<Badge
														className={
															"border-slate-700"
														}
													>
														{
															statusLabels[appointment.status] || appointment.status
														}
													</Badge>
												</TableCell>
												<TableCell>
													<div className="flex gap-2">
														<Button
															variant="outline"
															size="sm"
															className="border-slate-700 hover:bg-slate-800"
															onClick={() => {
																setSelectedAppointment(
																	appointment
																);
																setIsDetailsDialogOpen(
																	true
																);
															}}
														>
															{appointment.status ===
															"scheduled"
																? "Изменить"
																: "Просмотр"}
														</Button>
													</div>
												</TableCell>
											</TableRow>
											);
										})
									)}
								</TableBody>
							</Table>
							
							{/* Добавляем пагинацию */}
							<div className="flex items-center justify-between px-4 py-4 border-t border-slate-700">
								<div className="text-sm text-slate-400">
									Показано {appointments.length} из {totalCount} приёмов
								</div>
								<div className="flex items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => loadAppointments(currentPage - 1)}
										disabled={currentPage === 1}
										className="border-slate-700"
									>
										<ChevronLeft className="h-4 w-4" />
									</Button>
									<span className="text-sm">
										Страница {currentPage} из {totalPages}
									</span>
									<Button
										variant="outline"
										size="sm"
										onClick={() => loadAppointments(currentPage + 1)}
										disabled={currentPage === totalPages}
										className="border-slate-700"
									>
										<ChevronRight className="h-4 w-4" />
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</main>

			<AppointmentDetailsDialog
				appointment={selectedAppointment as any}
				open={isDetailsDialogOpen}
				onOpenChange={setIsDetailsDialogOpen}
				onUpdate={loadAppointments}
			/>
		</div>
	);
}
