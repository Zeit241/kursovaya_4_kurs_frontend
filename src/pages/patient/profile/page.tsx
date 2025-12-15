"use client";

import { patientsApi, usersApi } from "@/api/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, FileText, User as UserIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { PatternFormat } from "react-number-format";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { Patient, User } from "@/api/types";
import Footer from "@/components/Footer";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

const profileSchema = z.object({
	last_name: z.string().min(1, "Пожалуйста, введите фамилию"),
	first_name: z.string().min(1, "Пожалуйста, введите имя"),
	middle_name: z.string().optional(),
	birth_date: z
		.string()
		.min(1, "Пожалуйста, выберите дату рождения")
		.refine((date) => {
			const birthDate = new Date(date);
			const today = new Date();
			return birthDate < today;
		}, "Дата рождения не может быть в будущем"),
	gender: z.enum(["male", "female"], {
		required_error: "Пожалуйста, выберите пол",
	}),
	phone: z.string().min(1, "Пожалуйста, введите номер телефона"),
	insurance_number: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function PatientProfilePage() {
	const { user } = useAuth();
	const [isLoading, setIsLoading] = useState(false);
	const [fullUser, setFullUser] = useState<User | null>(null);
	const [patient, setPatient] = useState<Patient | null>(null);

	const fetchFullUser = async () => {
		if (!user) return;
		setIsLoading(true);
		try {
			// Получаем текущего пользователя с данными пациента
			const userData = await usersApi.getMe();
			setFullUser(userData);
			if (userData.patient) {
				// Получаем полные данные пациента
				const patientData = await patientsApi.getById(userData.patient.id);
				setPatient(patientData);
			}
		} catch (error) {
			console.error("Ошибка при загрузке профиля:", error);
			toast.error("Не удалось загрузить данные профиля");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchFullUser();
	}, [user]);

	const form = useForm<ProfileFormValues>({
		resolver: zodResolver(profileSchema),
		defaultValues: {
			last_name: "",
			first_name: "",
			middle_name: "",
			birth_date: "",
			gender: "male",
			phone: "",
			insurance_number: "",
		},
	});

	// Обновляем значения формы после получения данных
	useEffect(() => {
		if (fullUser && patient) {
			form.reset({
				last_name: fullUser.lastName || "",
				first_name: fullUser.firstName || "",
				middle_name: fullUser.middleName || "",
				birth_date: patient.birthDate || "",
				gender: patient.gender === 1 ? "male" : "female",
				phone: fullUser.phone || "",
				insurance_number: patient.insuranceNumber || "",
			});
		}
	}, [fullUser, patient, form]);

	const onSubmit = async (data: ProfileFormValues) => {
		if (!patient || !fullUser) {
			toast.error("Данные профиля не загружены");
			return;
		}

		try {
			setIsLoading(true);

			// Обновляем данные пациента (включая данные пользователя)
			await patientsApi.update(patient.id, {
				user: {
					phone: data.phone,
					firstName: data.first_name,
					lastName: data.last_name,
					middleName: data.middle_name || undefined,
				},
				birthDate: data.birth_date,
				gender: data.gender === "male" ? 1 : 2,
				insuranceNumber: data.insurance_number || undefined,
			});

			toast.success("Профиль успешно обновлен");
			// Обновляем данные после сохранения
			await fetchFullUser();
		} catch (error: any) {
			console.error("Ошибка при обновлении профиля:", error);
			const errorMessage = error.response?.data?.message || "Не удалось обновить профиль";
			toast.error(errorMessage);
		} finally {
			setIsLoading(false);
		}
	};


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
							Мой профиль
						</h2>
						<p className="mt-2 text-slate-600">
							Управление личными данными и настройками
						</p>
					</div>

					<div className="mx-auto max-w-4xl slide-up">
						{isLoading ? (
							<div className="flex justify-center items-center h-64">
								<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
							</div>
						) : (
							<Tabs defaultValue="personal" className="mb-8">
								<TabsList className="grid w-full grid-cols-2 bg-slate-100">
									<TabsTrigger
										value="personal"
										className="flex items-center gap-2"
									>
										<UserIcon className="h-4 w-4" />
										<span className="hidden sm:inline">
											Личные данные
										</span>
									</TabsTrigger>
									<TabsTrigger
										value="medical"
										className="flex items-center gap-2"
									>
										<FileText className="h-4 w-4" />
										<span className="hidden sm:inline">
											Медицинская информация
										</span>
									</TabsTrigger>
								</TabsList>

								<TabsContent
									value="personal"
									className="mt-6 scale-in"
								>
									<Card className="gradient-card hover-glow">
										<div className="h-1 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-teal-500"></div>
										<CardHeader>
											<CardTitle className="flex items-center gap-2">
												<UserIcon className="h-5 w-5 text-blue-600" />
												Личные данные
											</CardTitle>
											<CardDescription>
												Ваша основная информация
											</CardDescription>
										</CardHeader>
										<CardContent>
											{fullUser && patient && (
												<Form {...form}>
													<form
														onSubmit={form.handleSubmit(
															onSubmit
														)}
														className="space-y-6"
													>
														<div className="grid gap-4 md:grid-cols-2">
															<FormField
																control={
																	form.control
																}
																name="last_name"
																render={({
																	field,
																}) => (
																	<FormItem>
																		<FormLabel>
																			Фамилия
																		</FormLabel>
																		<FormControl>
																			<Input
																				className="light-input hover-scale"
																				{...field}
																			/>
																		</FormControl>
																		<FormMessage />
																	</FormItem>
																)}
															/>

															<FormField
																control={
																	form.control
																}
																name="first_name"
																render={({
																	field,
																}) => (
																	<FormItem>
																		<FormLabel>
																			Имя
																		</FormLabel>
																		<FormControl>
																			<Input
																				className="light-input hover-scale"
																				{...field}
																			/>
																		</FormControl>
																		<FormMessage />
																	</FormItem>
																)}
															/>
														</div>

														<FormField
															control={
																form.control
															}
															name="middle_name"
															render={({
																field,
															}) => (
																<FormItem>
																	<FormLabel>
																		Отчество
																	</FormLabel>
																	<FormControl>
																		<Input
																			className="light-input hover-scale"
																			{...field}
																		/>
																	</FormControl>
																	<FormMessage />
																</FormItem>
															)}
														/>

														<FormField
															control={
																form.control
															}
															name="birth_date"
															render={({
																field,
															}) => (
																<FormItem>
																	<FormLabel>
																		Дата
																		рождения
																	</FormLabel>
																	<FormControl>
																		<Input
																			type="date"
																			className="light-input hover-scale"
																			{...field}
																		/>
																	</FormControl>
																	<FormMessage />
																</FormItem>
															)}
														/>

														<FormField
															control={
																form.control
															}
															name="gender"
															render={({
																field,
															}) => (
																<FormItem>
																	<FormLabel>
																		Пол
																	</FormLabel>
																	<FormControl>
																		<RadioGroup
																			onValueChange={
																				field.onChange
																			}
																			value={
																				field.value
																			}
																			className="flex gap-4"
																		>
																			<div className="flex items-center space-x-2">
																				<RadioGroupItem
																					value="male"
																					id="male"
																				/>
																				<Label htmlFor="male">
																					Мужской
																				</Label>
																			</div>
																			<div className="flex items-center space-x-2">
																				<RadioGroupItem
																					value="female"
																					id="female"
																				/>
																				<Label htmlFor="female">
																					Женский
																				</Label>
																			</div>
																		</RadioGroup>
																	</FormControl>
																	<FormMessage />
																</FormItem>
															)}
														/>

														<FormField
															control={
																form.control
															}
															name="phone"
															render={({
																field,
															}) => (
																<FormItem>
																	<FormLabel>
																		Телефон
																	</FormLabel>
																	<FormControl>
																		<PatternFormat
																			format="+7 (###) ###-##-##"
																			mask="_"
																			className="light-input hover-scale"
																			{...field}
																			getInputRef={
																				field.ref
																			}
																			onValueChange={(
																				values
																			) => {
																				field.onChange(
																					values.value
																				);
																			}}
																			customInput={
																				Input
																			}
																		/>
																	</FormControl>
																	<FormMessage />
																</FormItem>
															)}
														/>

														<div className="flex justify-end">
															<Button
																type="submit"
																className="gradient-button"
															>
																Сохранить
																изменения
															</Button>
														</div>
													</form>
												</Form>
											)}
										</CardContent>
									</Card>
								</TabsContent>

								<TabsContent
									value="medical"
									className="mt-6 scale-in"
								>
									<Card className="gradient-card hover-glow">
										<div className="h-1 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-teal-500"></div>
										<CardHeader>
											<CardTitle className="flex items-center gap-2">
												<FileText className="h-5 w-5 text-purple-600" />
												Медицинская информация
											</CardTitle>
											<CardDescription>
												Важная медицинская информация о
												вас
											</CardDescription>
										</CardHeader>
										<CardContent>
											<Form {...form}>
												<form
													onSubmit={form.handleSubmit(
														onSubmit
													)}
													className="space-y-6"
												>
													<FormField
														control={form.control}
														name="insurance_number"
														render={({ field }) => (
															<FormItem>
																<FormLabel>
																	Номер полиса
																	ОМС
																</FormLabel>
																<FormControl>
																	<PatternFormat
																		format="###-###-### ####"
																		mask="_"
																		className="light-input hover-scale"
																		{...field}
																		getInputRef={
																			field.ref
																		}
																		onValueChange={(
																			values
																		) => {
																			field.onChange(
																				values.value
																			);
																		}}
																		customInput={
																			Input
																		}
																	/>
																</FormControl>
																<FormMessage />
															</FormItem>
														)}
													/>

													<div className="flex justify-end">
														<Button
															type="submit"
															className="gradient-button"
														>
															Сохранить изменения
														</Button>
													</div>
												</form>
											</Form>
										</CardContent>
									</Card>
								</TabsContent>
							</Tabs>
						)}
					</div>
				</div>
			</main>
			<Footer />
		</div>
	);
}
