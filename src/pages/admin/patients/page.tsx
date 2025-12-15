import { compareAsc, format, parse } from "date-fns";
import {
	Calendar,
	ChevronLeft,
	ChevronRight,
	MoreHorizontal,
	Pencil,
	PlusCircle,
	Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";

import { appointmentsApi, patientsApi } from "@/api/client";
import { Patient } from "@/api/types";
import { BookAppointmentForm } from "@/components/book-appointment-form";
import { EditPatientDialog } from "@/components/edit-patient-dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function PatientsPage() {
	const [patients, setPatients] = useState<Patient[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [selectedPatient, setSelectedPatient] =
		useState<Patient | null>(null);
	const [isEditing, setIsEditing] = useState<boolean>(false);
	const [isBookingDialogOpen, setIsBookingDialogOpen] =
		useState<boolean>(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [filteredPatients, setFilteredPatients] = useState<Patient[]>(
		[]
	);
	const [patientAppointments, setPatientAppointments] = useState<any[]>([]);
	const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
	const [isDeletingAppointment, setIsDeletingAppointment] = useState(false);
	const [appointmentToCancel, setAppointmentToCancel] = useState<
		number | null
	>(null);
	const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

	// Добавляем состояние для пагинации
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalCount, setTotalCount] = useState(0);
	const itemsPerPage = 10;

	useEffect(() => {
		fetchPatients(currentPage);
	}, [currentPage]);

	useEffect(() => {
		const filtered = patients.filter((patient) => {
			const fullName = `${patient.user.lastName} ${
				patient.user.firstName
			} ${patient.user.middleName || ""}`.toLowerCase();
			const searchLower = searchQuery.toLowerCase();
			return (
				fullName.includes(searchLower) ||
				(patient.insuranceNumber || "").includes(searchLower) ||
				patient.user.phone.includes(searchLower)
			);
		});
		setFilteredPatients(filtered);
	}, [searchQuery, patients]);

	const fetchPatients = async (page: number = 1) => {
		setIsLoading(true);
		try {
			const response = await patientsApi.getAll();
			setPatients(response);
			setFilteredPatients(response);
			setTotalCount(response.length);
			setTotalPages(Math.ceil(response.length / itemsPerPage));
			setCurrentPage(page);
		} catch (error) {
			toast.error("Ошибка при загрузке пациентов");
		} finally {
			setIsLoading(false);
		}
	};

	const fetchPatientAppointments = async (patientId: number) => {
		setIsLoadingAppointments(true);
		try {
			const response = await appointmentsApi.getByPatient(patientId);

			// Сортируем записи: сначала будущие по возрастанию, потом прошедшие по убыванию
			const sortedAppointments = response.sort((a, b) => {
				const dateA = new Date(a.startTime);
				const dateB = new Date(b.startTime);
				const now = new Date();

				// Если одна запись прошла, а другая нет
				const aIsPast = dateA < now;
				const bIsPast = dateB < now;
				if (aIsPast !== bIsPast) {
					return aIsPast ? 1 : -1;
				}

				// Если обе записи в будущем, сортируем по возрастанию
				if (!aIsPast && !bIsPast) {
					return compareAsc(dateA, dateB);
				}

				// Если обе записи в прошлом, сортируем по убыванию
				return compareAsc(dateB, dateA);
			});

			setPatientAppointments(sortedAppointments);
		} catch (error) {
			toast.error("Ошибка при загрузке записей пациента");
		} finally {
			setIsLoadingAppointments(false);
		}
	};

	const handleDeletePatient = async () => {
		if (!selectedPatient) return;

		try {
			await patientsApi.delete(selectedPatient.id);
			toast.success("Пациент успешно удален");
			fetchPatients();
		} catch (error: any) {
			toast.error(
				error.response?.data?.error || "Ошибка при удалении пациента"
			);
		} finally {
			setIsDeleteDialogOpen(false);
			setSelectedPatient(null);
		}
	};

	const handleDeleteAppointment = async (appointmentId: number) => {
		try {
			setIsDeletingAppointment(true);
			await appointmentsApi.cancel(appointmentId);
			toast.success("Запись успешно отменена");
			if (selectedPatient) {
				await fetchPatientAppointments(selectedPatient.id);
			}
		} catch (error) {
			toast.error("Ошибка при отмене записи");
		} finally {
			setIsDeletingAppointment(false);
			setAppointmentToCancel(null);
			setIsCancelDialogOpen(false);
		}
	};

	const canCancelAppointment = (startTime: string, status?: string) => {
		// Нельзя отменить, если запись уже отменена
		if (status === "cancelled") {
			return false;
		}
		const now = new Date();
		const appointmentDateTime = new Date(startTime);
		return appointmentDateTime > now;
	};

	return (
		<div className="flex flex-1 flex-col">
			<main className=" py-8">
				<div className="container mx-auto px-4">
					<div className="mb-8 flex items-center justify-between">
						<h2 className="text-3xl font-bold gradient-heading">
							Пациенты
						</h2>
						<Button asChild className="gradient-button">
							<Link to="/admin/patients/new">
								<PlusCircle className="mr-2 h-4 w-4" />
								Добавить пациента
							</Link>
						</Button>
					</div>

					<Card className="mb-6 gradient-card">
						<CardHeader>
							<CardTitle>Поиск пациента</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex flex-col gap-4 md:flex-row">
								<Input
									placeholder="Поиск по ФИО или номеру полиса"
									className="flex-1 border-slate-700"
									value={searchQuery}
									onChange={(e) =>
										setSearchQuery(e.target.value)
									}
								/>
								<Button className="gradient-button">
									Поиск
								</Button>
							</div>
						</CardContent>
					</Card>

					<Card className="gradient-card">
						<CardContent className="p-0">
							<Table>
								<TableHeader className="">
									<TableRow className=" border-slate-700">
										<TableHead>ФИО</TableHead>
										<TableHead>Дата рождения</TableHead>
										<TableHead>Номер полиса</TableHead>
										<TableHead>Телефон</TableHead>
										<TableHead>Действия</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{isLoading ? (
										<TableRow>
											<TableCell
												colSpan={5}
												className="text-center"
											>
												Загрузка...
											</TableCell>
										</TableRow>
									) : filteredPatients.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={5}
												className="text-center"
											>
												{searchQuery
													? "Ничего не найдено"
													: "Нет пациентов"}
											</TableCell>
										</TableRow>
									) : (
										filteredPatients.map((patient) => (
											<TableRow
												key={patient.id}
												className=" border-slate-700"
											>
												<TableCell className="font-medium">
													{patient.user.firstName}{" "}
													{patient.user.lastName}{" "}
													{patient.user.middleName}
												</TableCell>
												<TableCell>
													{patient.birthDate}
												</TableCell>
												<TableCell className="font-mono text-blue-300">
													{patient.insuranceNumber ||
														"-"}
												</TableCell>
												<TableCell>
													{patient.user.phone}
												</TableCell>
												<TableCell>
													<DropdownMenu>
														<DropdownMenuTrigger
															asChild
														>
															<Button
																variant="ghost"
																className="h-8 w-8 p-0"
															>
																<span className="sr-only">
																	Открыть меню
																</span>
																<MoreHorizontal className="h-4 w-4" />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end">
															<DropdownMenuItem
																onClick={() => {
																	setSelectedPatient(
																		patient
																	);
																	setIsEditing(
																		true
																	);
																}}
															>
																<Pencil className="mr-2 h-4 w-4" />
																Изменить
															</DropdownMenuItem>

															<DropdownMenuItem
																onClick={() => {
																	setSelectedPatient(
																		patient
																	);
																	setIsBookingDialogOpen(
																		true
																	);
																	fetchPatientAppointments(
																		patient.id
																	);
																}}
															>
																<Calendar className="mr-2 h-4 w-4" />
																Записать
															</DropdownMenuItem>
															<DropdownMenuItem
																className="text-red-600"
																onClick={() => {
																	setSelectedPatient(
																		patient
																	);
																	setIsDeleteDialogOpen(
																		true
																	);
																}}
															>
																<Trash2 className="mr-2 h-4 w-4" />
																Удалить
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
							
							{/* Добавляем пагинацию */}
							<div className="flex items-center justify-between px-4 py-4 border-t border-slate-700">
								<div className="text-sm text-slate-400">
									Показано {patients.length} из {totalCount} пациентов
								</div>
								<div className="flex items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => fetchPatients(currentPage - 1)}
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
										onClick={() => fetchPatients(currentPage + 1)}
										disabled={currentPage === totalPages}
										className="border-slate-700"
									>
										<ChevronRight className="h-4 w-4" />
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>

					{selectedPatient && isEditing && (
						<EditPatientDialog
							patient={selectedPatient}
							open={isEditing}
							onOpenChange={(open) => {
								setIsEditing(open);
								if (!open) {
									setSelectedPatient(null);
									fetchPatients();
								}
							}}
						/>
					)}

					{selectedPatient && (
						<Dialog
							open={isBookingDialogOpen}
							onOpenChange={setIsBookingDialogOpen}
						>
							<DialogContent
								className="max-w-4xl max-h-[80vh] overflow-y-auto"
								aria-describedby="booking-dialog-description"
							>
								<DialogTitle>Записать пациента</DialogTitle>
								<Tabs
									defaultValue="new-appointment"
									className="mt-4"
								>
									<TabsList className="grid w-full grid-cols-2">
										<TabsTrigger value="existing-appointments">
											Существующие записи
										</TabsTrigger>
										<TabsTrigger value="new-appointment">
											Новая запись
										</TabsTrigger>
									</TabsList>

									<TabsContent
										value="existing-appointments"
										className="mt-6"
									>
										{isLoadingAppointments ? (
											<div className="flex justify-center py-8">
												<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
											</div>
										) : patientAppointments.length > 0 ? (
											<div className="space-y-4">
												{patientAppointments.map(
													(appointment) => (
														<div
															key={appointment.id}
															className="rounded-lg border border-slate-200 bg-slate-50 p-4"
														>
															<div className="flex justify-between items-center">
																<div>
																	<p className="font-medium">
																		Врач ID: {appointment.doctorId}
																	</p>
																	<p className="text-sm text-slate-600">
																		Пациент ID: {appointment.patientId}
																	</p>
																	<p
																		className={`text-sm ${
																			canCancelAppointment(
																				appointment.startTime,
																				appointment.status
																			)
																				? "text-slate-600"
																				: "text-red-600"
																		}`}
																	>
																		{new Date(
																			appointment.startTime
																		).toLocaleDateString(
																			"ru-RU",
																			{
																				day: "numeric",
																				month: "long",
																				year: "numeric",
																			}
																		)}{" "}
																		в{" "}
																		{new Date(
																			appointment.startTime
																		).toLocaleTimeString(
																			"ru-RU",
																			{
																				hour: "2-digit",
																				minute: "2-digit",
																			}
																		)}
																	</p>
																</div>
																<div className="flex flex-col items-end gap-2">
																	<p className="text-sm">
																		{appointment.roomId ? `Кабинет ${appointment.roomId}` : "Кабинет не указан"}
																	</p>
																	{canCancelAppointment(
																		appointment.startTime,
																		appointment.status
																	) ? (
																		<Button
																			variant="outline"
																			size="sm"
																			className="text-red-600 border-red-200 hover:bg-red-50"
																			onClick={() => {
																				setAppointmentToCancel(
																					appointment.id
																				);
																				setIsCancelDialogOpen(
																					true
																				);
																			}}
																			disabled={
																				isDeletingAppointment
																			}
																		>
																			<Trash2 className="h-4 w-4 mr-2" />
																			Отменить
																			запись
																		</Button>
																	) : appointment.status === "cancelled" ? (
																		<div className="px-3 py-1 text-sm rounded-md bg-red-100 text-red-600">
																			Запись отменена
																		</div>
																	) : (
																		<div className="px-3 py-1 text-sm rounded-md bg-slate-100 text-slate-600">
																			Прием
																			завершен
																		</div>
																	)}
																</div>
															</div>
														</div>
													)
												)}
											</div>
										) : (
											<div className="text-center py-8 text-slate-600">
												У пациента нет записей
											</div>
										)}
									</TabsContent>

									<TabsContent
										value="new-appointment"
										className="mt-6"
									>
										<BookAppointmentForm
											onClose={() => {
												setIsBookingDialogOpen(false);
												setSelectedPatient(null);
												fetchPatients();
											}}
											patient={selectedPatient}
										/>
									</TabsContent>
								</Tabs>
							</DialogContent>
						</Dialog>
					)}

					<AlertDialog
						open={isDeleteDialogOpen}
						onOpenChange={setIsDeleteDialogOpen}
					>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>
									Подтверждение удаления
								</AlertDialogTitle>
								<AlertDialogDescription>
																Вы действительно хотите удалить пациента{" "}
																{selectedPatient?.user.lastName}{" "}
																{selectedPatient?.user.firstName}{" "}
																{selectedPatient?.user.middleName}?
									<br />
									Это действие нельзя будет отменить.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Отмена</AlertDialogCancel>
								<AlertDialogAction
									onClick={handleDeletePatient}
									className="bg-red-600 hover:bg-red-700"
								>
									Удалить
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>

					<AlertDialog
						open={isCancelDialogOpen}
						onOpenChange={setIsCancelDialogOpen}
					>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>
									Подтверждение отмены записи
								</AlertDialogTitle>
								<AlertDialogDescription>
									Вы действительно хотите отменить запись?
									<br />
									Это действие нельзя будет отменить.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel
									onClick={() => setAppointmentToCancel(null)}
								>
									Не отменять
								</AlertDialogCancel>
								<AlertDialogAction
									onClick={() =>
										appointmentToCancel &&
										handleDeleteAppointment(
											appointmentToCancel
										)
									}
									className="bg-red-600 hover:bg-red-700"
								>
									Отменить запись
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			</main>
		</div>
	);
}
