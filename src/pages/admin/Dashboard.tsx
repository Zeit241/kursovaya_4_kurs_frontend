import { appointmentsApi, doctorsApi, patientsApi } from "@/api/client";
import { CalendarDays, ClipboardList, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

interface DashboardStats {
	doctorsCount: number;
	patientsCount: number;
	appointmentsToday: number;
}

export default function AdminDashboard() {
	const [stats, setStats] = useState<DashboardStats>({
		doctorsCount: 0,
		patientsCount: 0,
		appointmentsToday: 0,
	});
	const [appointments, setAppointments] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			try {
				// Получаем статистику и ближайшие приемы параллельно
				const [doctorsData, patientsData, appointmentsData] = await Promise.all([
					doctorsApi.getAll(),
					patientsApi.getAll(),
					appointmentsApi.getAll(),
				]);

				// Фильтруем приемы на сегодня
				const today = new Date().toISOString().split('T')[0];
				const todayAppointments = appointmentsData.filter(apt => {
					const aptDate = apt.startTime.split('T')[0];
					return aptDate === today;
				});

				setStats({
					doctorsCount: doctorsData.length,
					patientsCount: patientsData.length,
					appointmentsToday: todayAppointments.length,
				});
				setAppointments(todayAppointments);
			} catch (error) {
				console.error("Ошибка при загрузке данных:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, []);

	if (loading) {
		return (
			<div className="flex-1 flex items-center justify-center">
				<div className="text-xl">Загрузка...</div>
			</div>
		);
	}

	return (
		<div className="flex-1 flex flex-col gradient-bg">
			<main className="py-8">
				<div className="container mx-auto px-4">
					<h2 className="mb-8 text-3xl font-bold gradient-heading">
						Панель управления
					</h2>
					<div className="grid gap-6 md:grid-cols-3">
						<Card className="gradient-card overflow-hidden">
							<div className="h-1 w-full bg-gradient-to-r from-blue-500 to-indigo-500"></div>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Врачи
								</CardTitle>
								<Users className="h-4 w-4 text-blue-400" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{stats.doctorsCount}
								</div>
								<p className="text-xs text-muted-foreground">
									Всего врачей в системе
								</p>
								<Button asChild className="mt-4 w-full">
									<Link to="/admin/doctors">
										Управление врачами
									</Link>
								</Button>
							</CardContent>
						</Card>
						<Card className="gradient-card overflow-hidden">
							<div className="h-1 w-full bg-gradient-to-r from-indigo-500 to-purple-500"></div>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Пациенты
								</CardTitle>
								<ClipboardList className="h-4 w-4 text-purple-400" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{stats.patientsCount}
								</div>
								<p className="text-xs text-muted-foreground">
									Всего пациентов в системе
								</p>
								<Button asChild className="mt-4 w-full ">
									<Link to="/admin/patients">
										Управление пациентами
									</Link>
								</Button>
							</CardContent>
						</Card>
						<Card className="gradient-card overflow-hidden">
							<div className="h-1 w-full bg-gradient-to-r from-purple-500 to-teal-500"></div>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Приёмы
								</CardTitle>
								<CalendarDays className="h-4 w-4 text-teal-400" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{stats.appointmentsToday}
								</div>
								<p className="text-xs text-muted-foreground">
									Приёмов на сегодня
								</p>
								<Button asChild className="mt-4 w-full ">
									<Link to="/admin/appointments">
										Управление приёмами
									</Link>
								</Button>
							</CardContent>
						</Card>
					</div>

					<div className="mt-8 grid gap-6 md:grid-cols-2">
						<Card className="gradient-card">
							<CardHeader>
								<CardTitle className="text-xl">
									Быстрые действия
								</CardTitle>
								<CardDescription>
									Часто используемые функции
								</CardDescription>
							</CardHeader>
							<CardContent className="grid gap-4">
								<Button asChild className="w-full ">
									<Link to="/admin/patients/new">
										Добавить нового пациента
									</Link>
								</Button>
								<Button asChild className="w-full ">
									<Link to="/admin/doctors/new">
										Добавить нового врача
									</Link>
								</Button>
							</CardContent>
						</Card>

						<Card className="gradient-card">
							<CardHeader>
								<CardTitle className="text-xl">
									Приёмы на сегодня
								</CardTitle>
								<CardDescription>
									Ближайшие приёмы
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{appointments.map((appointment) => (
										<div
											key={appointment.id}
											className="flex items-center justify-between rounded-lg border border-slate-800 p-3 transition-all hover:border-blue-900/50 hover:bg-slate-800/50"
										>
											<div>
												<p className="font-medium">
													Пациент ID: {appointment.patientId}
												</p>
												<p className="text-sm text-muted-foreground">
													Врач ID: {appointment.doctorId}
												</p>
											</div>
											<div className="text-right">
												<p className="font-medium">
													{new Date(appointment.startTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
												</p>
												<p className="text-sm text-muted-foreground">
													{appointment.roomId ? `Кабинет ${appointment.roomId}` : 'Кабинет не указан'}
												</p>
											</div>
										</div>
									))}
								</div>
								<Button asChild className="mt-4 w-full ">
									<Link to="/admin/appointments">
										Все приёмы
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
