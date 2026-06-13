"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface DoctorScheduleSummaryCardProps {
	startDate: string;
	endDate: string;
	viewMode: "day" | "week";
	scheduledCount: number;
	inProgressCount: number;
	completedCount: number;
	cancelledCount: number;
	totalCount: number;
}

export function DoctorScheduleSummaryCard({
	startDate,
	endDate,
	viewMode,
	scheduledCount,
	inProgressCount,
	completedCount,
	cancelledCount,
	totalCount,
}: DoctorScheduleSummaryCardProps) {
	const periodLabel =
		viewMode === "week" || startDate !== endDate
			? `${format(new Date(`${startDate}T12:00:00`), "d MMM", { locale: ru })} – ${format(
					new Date(`${endDate}T12:00:00`),
					"d MMM yyyy",
					{ locale: ru }
				)}`
			: format(new Date(`${startDate}T12:00:00`), "d MMMM yyyy", { locale: ru });

	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="text-base">Моё расписание</CardTitle>
				<p className="text-sm text-muted-foreground">{periodLabel}</p>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
					<div>
						<p className="text-xs text-muted-foreground">Всего</p>
						<p className="text-2xl font-bold">{totalCount}</p>
					</div>
					<div>
						<p className="text-xs text-muted-foreground">Запланировано</p>
						<p className="text-2xl font-bold text-blue-600">{scheduledCount}</p>
					</div>
					<div>
						<p className="text-xs text-muted-foreground">В процессе</p>
						<p className="text-2xl font-bold text-amber-600">{inProgressCount}</p>
					</div>
					<div>
						<p className="text-xs text-muted-foreground">Завершено</p>
						<p className="text-2xl font-bold text-green-600">{completedCount}</p>
					</div>
					<div>
						<p className="text-xs text-muted-foreground">Отменено</p>
						<p className="text-2xl font-bold text-red-600">{cancelledCount}</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
