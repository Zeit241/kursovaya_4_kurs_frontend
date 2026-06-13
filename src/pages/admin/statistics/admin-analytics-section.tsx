"use client";

import type {
	AttendanceDynamics,
	DoctorWorkloadItem,
	FinancialStats,
} from "@/api/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
	Bar,
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	BarChart as RechartsBarChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

function formatMoney(value: number | string | undefined): string {
	const n = Number(value ?? 0);
	return new Intl.NumberFormat("ru-RU", {
		style: "currency",
		currency: "RUB",
		maximumFractionDigits: 0,
	}).format(n);
}

interface AdminAnalyticsSectionProps {
	workload: DoctorWorkloadItem[];
	financial: FinancialStats | null;
	attendance: AttendanceDynamics | null;
}

export function AdminAnalyticsSection({
	workload,
	financial,
	attendance,
}: AdminAnalyticsSectionProps) {
	const workloadChart = workload.map((w) => ({
		name: w.doctorDisplayName,
		scheduled: w.scheduledCount,
		inProgress: w.inProgressCount,
		completed: w.completedCount,
		cancelled: w.cancelledCount,
		total: w.totalCount,
	}));

	const financialChart =
		financial?.dailyBreakdown?.map((d) => ({
			date: format(new Date(`${d.date}T12:00:00`), "d MMM", { locale: ru }),
			revenue: Number(d.revenue ?? 0),
			completed: d.completedCount,
		})) ?? [];

	const attendanceChart =
		attendance?.dailyItems?.map((d) => ({
			date: format(new Date(`${d.date}T12:00:00`), "d MMM", { locale: ru }),
			total: d.totalCount,
			completed: d.completedCount,
			scheduled: d.scheduledCount,
			cancelled: d.cancelledCount,
		})) ?? [];

	return (
		<div className="mt-8 space-y-8">
			<div className="grid gap-4 md:grid-cols-3">
				<Card className="gradient-card">
					<CardHeader className="pb-2">
						<CardTitle className="text-base">Выручка</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold">
							{formatMoney(financial?.totalRevenue)}
						</p>
						<p className="text-sm text-muted-foreground">
							Завершённых приёмов: {financial?.completedCount ?? 0}
						</p>
						<p className="text-sm text-muted-foreground">
							Средний чек: {formatMoney(financial?.averageCheck)}
						</p>
					</CardContent>
				</Card>
				<Card className="gradient-card">
					<CardHeader className="pb-2">
						<CardTitle className="text-base">Загрузка врачей</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold">{workload.length}</p>
						<p className="text-sm text-muted-foreground">врачей в периоде</p>
					</CardContent>
				</Card>
				<Card className="gradient-card">
					<CardHeader className="pb-2">
						<CardTitle className="text-base">Посещаемость</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold">
							{attendance?.dailyItems?.reduce((s, d) => s + d.totalCount, 0) ?? 0}
						</p>
						<p className="text-sm text-muted-foreground">приёмов с пациентами</p>
					</CardContent>
				</Card>
			</div>

			{workloadChart.length > 0 && (
				<Card className="gradient-card">
					<CardHeader>
						<CardTitle>Загрузка врачей по статусам</CardTitle>
					</CardHeader>
					<CardContent className="h-[360px]">
						<ResponsiveContainer width="100%" height="100%">
							<RechartsBarChart data={workloadChart}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="name" angle={-25} textAnchor="end" height={80} />
								<YAxis />
								<Tooltip />
								<Legend />
								<Bar dataKey="scheduled" stackId="a" fill="#3b82f6" name="Запланировано" />
								<Bar dataKey="inProgress" stackId="a" fill="#f59e0b" name="В процессе" />
								<Bar dataKey="completed" stackId="a" fill="#22c55e" name="Завершено" />
								<Bar dataKey="cancelled" stackId="a" fill="#ef4444" name="Отменено" />
							</RechartsBarChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>
			)}

			{financialChart.length > 0 && (
				<Card className="gradient-card">
					<CardHeader>
						<CardTitle>Финансовая динамика</CardTitle>
					</CardHeader>
					<CardContent className="h-[360px]">
						<ResponsiveContainer width="100%" height="100%">
							<LineChart data={financialChart}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="date" />
								<YAxis yAxisId="left" />
								<YAxis yAxisId="right" orientation="right" />
								<Tooltip
									formatter={(value, name) =>
										name === "revenue"
											? formatMoney(value as number)
											: value
									}
								/>
								<Legend />
								<Line
									yAxisId="left"
									type="monotone"
									dataKey="revenue"
									stroke="#2563eb"
									name="Выручка"
									strokeWidth={2}
								/>
								<Line
									yAxisId="right"
									type="monotone"
									dataKey="completed"
									stroke="#16a34a"
									name="Завершённые"
									strokeWidth={2}
								/>
							</LineChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>
			)}

			{attendanceChart.length > 0 && (
				<Card className="gradient-card">
					<CardHeader>
						<CardTitle>Динамика посещаемости</CardTitle>
					</CardHeader>
					<CardContent className="h-[360px]">
						<ResponsiveContainer width="100%" height="100%">
							<LineChart data={attendanceChart}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="date" />
								<YAxis />
								<Tooltip />
								<Legend />
								<Line
									type="monotone"
									dataKey="total"
									stroke="#6366f1"
									name="Всего"
									strokeWidth={2}
								/>
								<Line
									type="monotone"
									dataKey="completed"
									stroke="#22c55e"
									name="Завершено"
									strokeWidth={2}
								/>
								<Line
									type="monotone"
									dataKey="scheduled"
									stroke="#3b82f6"
									name="Запланировано"
									strokeWidth={2}
								/>
								<Line
									type="monotone"
									dataKey="cancelled"
									stroke="#ef4444"
									name="Отменено"
									strokeWidth={2}
								/>
							</LineChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
