import { zodResolver } from "@hookform/resolvers/zod";
import { format, parse } from "date-fns";
import { Check, Loader2, Star, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { appointmentsApi, doctorsApi, specializationsApi } from "@/api/client";
import { Patient, Doctor, AvailableAppointmentSlot, Specialization } from "@/api/types";
import { DoctorReviewsDialog } from "@/components/doctor-reviews-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const bookingFormSchema = z.object({
	step: z.number().min(1).max(2),
	specialty: z.string().min(1, "Выберите специальность"),
	doctor: z.string().min(1, "Выберите врача"),
	date: z.string().min(1, "Выберите дату"),
	time: z.string().min(1, "Выберите время"),
	slot_id: z.number().optional(),
	reason: z.string().optional(),
	notificationType: z.enum(["email", "none"], {
		required_error: "Выберите способ уведомления",
	}),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

interface BookAppointmentFormProps {
	patient: Patient;
	onClose?: () => void;
}

export function BookAppointmentForm({
	patient,
	onClose,
}: BookAppointmentFormProps) {
	const { user } = useAuth();
	const form = useForm<BookingFormValues>({
		resolver: zodResolver(bookingFormSchema),
		defaultValues: {
			step: 1,
			specialty: "",
			doctor: "",
			date: "",
			time: "",
			notificationType: "email",
		},
	});

	const [specialties, setSpecialties] = useState<Specialization[]>([]);
	const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
	const [doctors, setDoctors] = useState<Doctor[]>([]);
	const [slots, setSlots] = useState<AvailableAppointmentSlot[]>([]);
	const [isLoadingSpecialties, setIsLoadingSpecialties] = useState(false);
	const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
	const [isLoadingSlots, setIsLoadingSlots] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [selectedDoctorForReviews, setSelectedDoctorForReviews] = useState<{
		id: number;
		name: string;
	} | null>(null);
	const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false);

	const step = form.watch("step");
	const selectedSpecialty = form.watch("specialty");
	const selectedDoctor = form.watch("doctor");
	const selectedDate = form.watch("date");

	useEffect(() => {
		fetchSpecialties();
	}, []);

	useEffect(() => {
		if (selectedSpecialty) {
			fetchDoctors();
		} else {
			setDoctors([]);
		}
	}, [selectedSpecialty]);

	useEffect(() => {
		if (selectedDoctor && selectedDate) {
			fetchSlots();
			// Сбрасываем выбранное время при изменении врача или даты
			form.setValue("time", "");
			form.setValue("slot_id", undefined);
		} else {
			setSlots([]);
		}
	}, [selectedDoctor, selectedDate]);

	const fetchSpecialties = async () => {
		setIsLoadingSpecialties(true);
		try {
			const response = await specializationsApi.getAll();
			setSpecialties(response);
		} finally {
			setIsLoadingSpecialties(false);
		}
	};

	const fetchDoctors = async () => {
		if (!selectedSpecialty) {
			setDoctors([]);
			return;
		}
		setIsLoadingDoctors(true);
		try {
			// Получаем всех врачей один раз, если еще не загружены
			let doctorsToFilter = allDoctors;
			if (allDoctors.length === 0) {
				const response = await doctorsApi.getAll();
				setAllDoctors(response);
				doctorsToFilter = response;
			}
			// Фильтруем врачей по выбранной специальности
			const filteredDoctors = doctorsToFilter.filter((doctor) =>
				doctor.specializations.some(
					(spec) => spec.id.toString() === selectedSpecialty
				)
			);
			setDoctors(filteredDoctors);
		} finally {
			setIsLoadingDoctors(false);
		}
	};

	const fetchSlots = async () => {
		setIsLoadingSlots(true);
		try {
			const response = await appointmentsApi.getAvailable(
				Number(selectedDoctor),
				selectedDate
			);
			setSlots(response);
		} finally {
			setIsLoadingSlots(false);
		}
	};

	const handleNextStep = () => {
		if (
			step === 1 &&
			selectedSpecialty &&
			selectedDoctor &&
			selectedDate &&
			form.watch("time")
		) {
			form.setValue("step", 2);
		}
	};

	const handlePrevStep = () => {
		if (step === 2) {
			form.setValue("step", 1);
		}
	};

	const handleSubmit = async (data: BookingFormValues) => {
		console.log(patient);
		if (!user?.id || !data.slot_id) {
			toast.error("Ошибка", {
				description: "Не удалось определить пользователя или слот",
			});
			return;
		}

		setIsSubmitting(true);
		try {
			// Находим выбранный слот
			const selectedSlot = slots.find((slot) => slot.id === data.slot_id);
			if (!selectedSlot || selectedSlot.isBooked) {
				toast.error("Ошибка", {
					description: "Выбранный слот недоступен",
				});
				return;
			}

			await appointmentsApi.book({
				appointmentId: data.slot_id,
				userId: patient?.user?.id || user.id,
			});

			toast.success("Запись успешно создана", {
				description: "Вы успешно записались на прием к врачу",
			});

			if (onClose) {
				onClose();
			}
		} catch (error: any) {
			const errorMessage =
				error.response?.data?.message ||
				"Пожалуйста, попробуйте еще раз";
			toast.error("Ошибка при создании записи", {
				description: errorMessage,
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="w-full slide-up">
			<div className="mb-8">
				<div className="flex items-center justify-between">
					<div
						className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-500 ${
							step >= 1
								? "bg-blue-600 text-white"
								: "bg-slate-200 text-slate-600"
						}`}
					>
						{step > 1 ? (
							<Check className="h-5 w-5" />
						) : (
							<span>1</span>
						)}
					</div>
					<div
						className={`h-1 flex-1 transition-all duration-500 ${
							step >= 2 ? "bg-blue-600" : "bg-slate-200"
						}`}
					></div>
					<div
						className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-500 ${
							step >= 2
								? "bg-blue-600 text-white"
								: "bg-slate-200 text-slate-600"
						}`}
					>
						{step > 2 ? (
							<Check className="h-5 w-5" />
						) : (
							<span>2</span>
						)}
					</div>
				</div>
				<div className="mt-2 flex justify-between">
					<span className="text-sm">Выбор специалиста и времени</span>
					<span className="text-sm">Подтверждение записи</span>
				</div>
			</div>

			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(handleSubmit)}
					className="space-y-6"
				>
					{step === 1 && (
						<Card className="gradient-card scale-in hover-glow">
							<div className="h-1 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-teal-500"></div>
							<CardHeader>
								<CardTitle>
									Выберите специалиста и время
								</CardTitle>
								<CardDescription>Шаг 1 из 2</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<FormField
									control={form.control}
									name="specialty"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Специальность</FormLabel>
											<Select
												onValueChange={field.onChange}
												value={field.value}
												disabled={isLoadingSpecialties}
											>
												<FormControl>
													<SelectTrigger className="light-input hover-scale">
														<SelectValue
															placeholder={
																isLoadingSpecialties
																	? "Загрузка..."
																	: "Выберите специальность"
															}
														/>
														{isLoadingSpecialties && (
															<Loader2 className="h-4 w-4 animate-spin ml-2" />
														)}
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{specialties.map(
														(specialty) => (
															<SelectItem
																key={
																	specialty.id
																}
																value={specialty.id.toString()}
															>
																{specialty.name}
															</SelectItem>
														)
													)}
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="doctor"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Врач</FormLabel>
											{!selectedSpecialty || isLoadingDoctors ? (
												<div className="text-sm text-slate-500 p-4 border border-slate-200 rounded-md">
													{isLoadingDoctors
														? "Загрузка врачей..."
														: "Сначала выберите специальность"}
												</div>
											) : doctors.length === 0 ? (
												<div className="text-sm text-slate-500 p-4 border border-slate-200 rounded-md">
													Нет доступных врачей по выбранной специальности
												</div>
											) : (
												<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
													{doctors.map((doctor) => {
														const fullName = `${doctor.user.lastName} ${doctor.user.firstName} ${doctor.user.middleName}`.trim();
														const isSelected = field.value === doctor.id.toString();
														return (
															<div
																key={doctor.id}
																onClick={() => {
																	field.onChange(doctor.id.toString());
																}}
																className={`relative cursor-pointer rounded-lg border-2 transition-all hover:shadow-lg ${
																	isSelected
																		? "border-blue-500 bg-blue-50"
																		: "border-slate-200 bg-white hover:border-blue-300"
																}`}
															>
																<div className="p-4">
																	<div className="flex items-start gap-3">
																		{doctor.photo ? (
																			<img
																				src={
																					doctor.photo.startsWith("data:image")
																						? doctor.photo
																						: `data:image/jpeg;base64,${doctor.photo}`
																				}
																				alt={fullName}
																				className="w-16 h-16 rounded-full object-cover border-2 border-slate-200"
																				onError={(e) => {
																					// Если изображение не загрузилось, заменяем на placeholder
																					const target = e.target as HTMLImageElement;
																					target.style.display = "none";
																					const placeholder = document.createElement("div");
																					placeholder.className = "w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center border-2 border-slate-300";
																					placeholder.innerHTML = '<svg class="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>';
																					target.parentElement?.insertBefore(placeholder, target);
																				}}
																			/>
																		) : (
																			<div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center border-2 border-slate-300">
																				<User className="h-8 w-8 text-slate-400" />
																			</div>
																		)}
																		<div className="flex-1 min-w-0">
																			<h3 className="font-medium text-sm truncate">
																				{fullName}
																			</h3>
																			{doctor.bio && (
																				<p className="text-xs text-slate-500 mt-1 line-clamp-2">
																					{doctor.bio}
																				</p>
																			)}
																			{doctor.experienceYears > 0 && (
																				<p className="text-xs text-slate-500 mt-1">
																					Опыт: {doctor.experienceYears} {doctor.experienceYears === 1 ? "год" : doctor.experienceYears < 5 ? "года" : "лет"}
																				</p>
																			)}
																			{doctor.rating !== null && doctor.reviewCount > 0 && (
																				<div
																					className="flex items-center gap-1 mt-2"
																					onClick={(e) => {
																						e.stopPropagation();
																						setSelectedDoctorForReviews({
																							id: doctor.id,
																							name: fullName,
																						});
																						setIsReviewsDialogOpen(true);
																					}}
																				>
																					<div className="flex items-center gap-0.5">
																						{[1, 2, 3, 4, 5].map((star) => (
																							<Star
																								key={star}
																								className={`h-3.5 w-3.5 ${
																									star <= Math.round(doctor.rating!)
																										? "fill-yellow-400 text-yellow-400"
																										: "text-slate-300"
																								}`}
																							/>
																						))}
																					</div>
																					<span className="text-xs text-slate-600 ml-1 hover:text-blue-600">
																						{doctor.rating.toFixed(1)} ({doctor.reviewCount})
																					</span>
																				</div>
																			)}
																		</div>
																	</div>
																</div>
																{isSelected && (
																	<div className="absolute top-2 right-2">
																		<div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
																			<Check className="h-4 w-4 text-white" />
																		</div>
																	</div>
																)}
															</div>
														);
													})}
												</div>
											)}
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="date"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Дата</FormLabel>
											<FormControl>
												<Input
													type="date"
													className="light-input hover-scale"
													disabled={!selectedDoctor}
													min={
														new Date()
															.toISOString()
															.split("T")[0]
													}
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								{selectedDate && (
									<FormField
										control={form.control}
										name="time"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													Доступное время
												</FormLabel>

												{isLoadingSlots ? (
													<div className="flex justify-center py-4">
														<Loader2 className="h-6 w-6 animate-spin" />
													</div>
												) : slots.length > 0 ? (
													<div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
														{slots
															.filter((slot) => !slot.isBooked)
															.map((slot) => {
																const slotTime = new Date(slot.startTime).toLocaleTimeString("ru-RU", {
																	hour: "2-digit",
																	minute: "2-digit",
																});
																return (
																	<Button
																		key={slot.id}
																		type="button"
																		disabled={slot.isBooked}
																		variant={
																			field.value === slotTime
																				? "default"
																				: "outline"
																		}
																		className={
																			field.value === slotTime
																				? "gradient-button"
																				: "border-slate-300 hover:bg-slate-100 text-slate-800 hover-scale"
																		}
																		onClick={() => {
																			field.onChange(slotTime);
																			form.setValue("slot_id", slot.id);
																		}}
																	>
																		{slotTime}
																	</Button>
																);
															})}
													</div>
												) : (
													<div className="text-center text-slate-400 w-full py-4">
														На текущую дату нет
														доступных слотов.
														Пожалуйста выберите
														другую дату.
													</div>
												)}

												<FormMessage />
											</FormItem>
										)}
									/>
								)}

								<div className="flex justify-end">
									<Button
										type="button"
										className="gradient-button"
										disabled={
											!selectedSpecialty ||
											!selectedDoctor ||
											!selectedDate ||
											!form.watch("time") ||
											isLoadingSlots
										}
										onClick={handleNextStep}
									>
										Продолжить
									</Button>
								</div>
							</CardContent>
						</Card>
					)}

					{step === 2 && (
						<Card className="gradient-card scale-in hover-glow w-full">
							<div className="h-1 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-teal-500"></div>
							<CardHeader>
								<CardTitle>Подтверждение записи</CardTitle>
								<CardDescription>Шаг 2 из 2</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
									<h3 className="text-lg font-medium">
										Информация о приёме
									</h3>
									<div className="mt-4 space-y-2">
										<div className="flex justify-between">
											<span className="text-slate-600">
												Специальность:
											</span>
											<span>
												{
													specialties.find(
														(s) =>
															s.id.toString() ===
															selectedSpecialty
													)?.name
												}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-slate-600">
												Врач:
											</span>
											<span>
												{
													doctors.find(
														(d) =>
															d.id.toString() ===
															selectedDoctor
													)?.user.lastName
												}{" "}
												{
													doctors.find(
														(d) =>
															d.id.toString() ===
															selectedDoctor
													)?.user.firstName
												}{" "}
												{
													doctors.find(
														(d) =>
															d.id.toString() ===
															selectedDoctor
													)?.user.middleName
												}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-slate-600">
												Дата и время:
											</span>
											<span>
												{new Date(selectedDate).toLocaleDateString("ru-RU", {
													day: "numeric",
													month: "long",
													year: "numeric",
												})}{" "}
												в {form.watch("time")}
											</span>
										</div>
									</div>
								</div>

								<FormField
									control={form.control}
									name="reason"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Причина обращения
											</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Опишите причину обращения к врачу"
													className="light-input hover-scale"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="notificationType"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Способ напоминания
											</FormLabel>
											<FormControl>
												<RadioGroup
													onValueChange={
														field.onChange
													}
													value={field.value}
													className="flex flex-col gap-2"
												>
													<div className="flex items-center space-x-2"></div>
													<div className="flex items-center space-x-2">
														<RadioGroupItem
															value="email"
															id="email"
														/>
														<Label htmlFor="email">
															Email на адрес
															{"   " +
																patient?.user
																	.email}
														</Label>
													</div>
													<div className="flex items-center space-x-2">
														<RadioGroupItem
															value="none"
															id="none"
														/>
														<Label htmlFor="none">
															Не отправлять
														</Label>
													</div>
												</RadioGroup>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<div className="flex justify-between">
									<Button
										type="button"
										variant="outline"
										className="border-slate-300 hover-scale"
										onClick={handlePrevStep}
										disabled={isSubmitting}
									>
										Назад
									</Button>
									<Button
										type="submit"
										className="gradient-button"
										disabled={isSubmitting}
									>
										{isSubmitting ? (
											<>
												<Loader2 className="h-4 w-4 animate-spin mr-2" />
												Отправка...
											</>
										) : (
											"Подтвердить запись"
										)}
									</Button>
								</div>
							</CardContent>
						</Card>
					)}
				</form>
			</Form>
			{selectedDoctorForReviews && (
				<DoctorReviewsDialog
					doctorId={selectedDoctorForReviews.id}
					doctorName={selectedDoctorForReviews.name}
					open={isReviewsDialogOpen}
					onOpenChange={setIsReviewsDialogOpen}
				/>
			)}
		</div>
	);
}
