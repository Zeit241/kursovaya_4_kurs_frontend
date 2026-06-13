"use client";

import type { Appointment } from "@/api/types";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { formatAppointmentDateTime } from "@/lib/appointment-time";
import { cn } from "@/lib/utils";
import { eachDayOfInterval, format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";
import {
	isOccupiedSlot,
	patientShortName,
	statusLabels,
} from "./doctor-appointments-utils";

interface DoctorWeekScheduleBoardProps {
	loading: boolean;
	appointments: Appointment[];
	startDate: string;
	endDate: string;
	onSlotClick: (appointmentId: number) => void;
}

export function DoctorWeekScheduleBoard({
	loading,
	appointments,
	startDate,
	endDate,
	onSlotClick,
}: DoctorWeekScheduleBoardProps) {
	const days = useMemo(() => {
		const start = parseISO(startDate);
		const end = parseISO(endDate);
		return eachDayOfInterval({ start, end });
	}, [startDate, endDate]);

	const byDay = useMemo(() => {
		const map = new Map<string, Appointment[]>();
		for (const day of days) {
			map.set(format(day, "yyyy-MM-dd"), []);
		}
		for (const a of appointments) {
			if (!isOccupiedSlot(a)) continue;
			const key = formatAppointmentDateTime(a.startTime, "yyyy-MM-dd");
			const list = map.get(key);
			if (list) list.push(a);
		}
		for (const list of map.values()) {
			list.sort(
				(a, b) =>
					new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
			);
		}
		return map;
	}, [appointments, days]);

	return (
		<Card className="lg:col-span-2">
			<CardHeader>
				<CardTitle>Расписание на неделю</CardTitle>
				<CardDescription>
					Обзор приёмов по дням — только слоты с пациентами
				</CardDescription>
			</CardHeader>
			<CardContent>
				{loading ? (
					<div className="flex justify-center py-16">
						<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
					</div>
				) : (
					<div className="grid gap-3 md:grid-cols-7">
						{days.map((day) => {
							const key = format(day, "yyyy-MM-dd");
							const dayItems = byDay.get(key) ?? [];
							const isToday = key === format(new Date(), "yyyy-MM-dd");

							return (
								<div
									key={key}
									className={cn(
										"rounded-lg border bg-card p-2 min-h-[10rem]",
										isToday && "border-primary/50 bg-primary/5"
									)}
								>
									<div className="mb-2 border-b pb-2">
										<p className="text-xs font-medium text-muted-foreground">
											{format(day, "EEEE", { locale: ru })}
										</p>
										<p className="text-sm font-semibold">
											{format(day, "d MMM", { locale: ru })}
										</p>
										<p className="text-[10px] text-muted-foreground">
											{dayItems.length} приём(ов)
										</p>
									</div>
									<div className="space-y-2">
										{dayItems.length === 0 ? (
											<p className="text-[11px] text-muted-foreground">
												Нет приёмов
											</p>
										) : (
											dayItems.map((a) => (
												<button
													key={a.id}
													type="button"
													className="w-full rounded-md border bg-background p-2 text-left text-xs transition-colors hover:border-primary/40 hover:bg-muted/50"
													onClick={() => onSlotClick(a.id)}
												>
													<p className="font-medium">
														{formatAppointmentDateTime(a.startTime, "HH:mm")}
													</p>
													<p className="truncate text-muted-foreground">
														{patientShortName(a)}
													</p>
													<Badge
														variant="outline"
														className="mt-1 text-[9px]"
													>
														{statusLabels[a.status] ?? a.status}
													</Badge>
												</button>
											))
										)}
									</div>
								</div>
							);
						})}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
