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
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";
import {
	blockPosition,
	formatDiagnosisLabel,
	isOccupiedSlot,
	patientShortName,
	roomDisplayName,
	statusLabels,
	timelineBounds,
} from "./doctor-appointments-utils";

interface DoctorOccupiedSlotsBoardProps {
	loading: boolean;
	appointments: Appointment[];
	dateStr: string;
	className?: string;
	onSlotClick: (appointmentId: number) => void;
}

export function DoctorOccupiedSlotsBoard({
	loading,
	appointments,
	dateStr,
	className,
	onSlotClick,
}: DoctorOccupiedSlotsBoardProps) {
	const occupied = useMemo(
		() =>
			[...appointments]
				.filter(isOccupiedSlot)
				.sort(
					(a, b) =>
						new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
				),
		[appointments]
	);

	const { startMin, endMin, hours } = useMemo(
		() => timelineBounds(occupied),
		[occupied]
	);

	const dateLabel = useMemo(() => {
		try {
			return format(new Date(`${dateStr}T12:00:00`), "d MMMM yyyy, EEEE", {
				locale: ru,
			});
		} catch {
			return dateStr;
		}
	}, [dateStr]);

	return (
		<Card className={cn("lg:col-span-2", className)}>
			<CardHeader>
				<CardTitle>Занятые слоты</CardTitle>
				<CardDescription>
					Обзор дня на шкале времени (только просмотр)
				</CardDescription>
			</CardHeader>
			<CardContent>
				{loading ? (
					<div className="flex justify-center py-16">
						<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
					</div>
				) : occupied.length === 0 ? (
					<p className="py-8 text-center text-sm text-muted-foreground">
						На {dateLabel} занятых слотов нет
					</p>
				) : (
					<div className="overflow-x-auto rounded-lg border bg-card">
						<div className="min-w-[640px]">
							{/* Шапка с датой и часами */}
							<div className="grid border-b bg-muted/30" style={{ gridTemplateColumns: "11rem 1fr" }}>
								<div className="border-r px-3 py-2 text-xs font-medium text-muted-foreground">
									{dateLabel}
								</div>
								<div className="relative h-10">
									{hours.map((h) => {
										const left =
											((h * 60 - startMin) / Math.max(endMin - startMin, 1)) *
											100;
										return (
											<div
												key={h}
												className="absolute top-0 flex h-full flex-col justify-end border-l border-border/60 pb-1 pl-1"
												style={{ left: `${left}%` }}
											>
												<span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">
													{String(h).padStart(2, "0")}:00
												</span>
											</div>
										);
									})}
								</div>
							</div>

							{/* Строки — по одной на каждый занятый слот */}
							{occupied.map((a, idx) => {
								const { left, width } = blockPosition(
									a.startTime,
									a.endTime,
									startMin,
									endMin
								);
								const timeRange = `${formatAppointmentDateTime(a.startTime, "HH:mm")} – ${formatAppointmentDateTime(a.endTime, "HH:mm")}`;
								const diagnosis = formatDiagnosisLabel(a);

								return (
									<div
										key={a.id}
										className={cn(
											"grid border-b last:border-b-0",
											idx % 2 === 1 && "bg-muted/20"
										)}
										style={{ gridTemplateColumns: "11rem 1fr" }}
									>
										<div className="flex flex-col justify-center gap-1 border-r px-3 py-3">
											<span className="text-sm font-medium leading-tight">
												{patientShortName(a)}
											</span>
											<Badge variant="outline" className="w-fit text-[10px]">
												{statusLabels[a.status] ?? a.status}
											</Badge>
										</div>

										<div className="relative min-h-[4.5rem] py-2 pr-2">
											{/* вертикальные линии сетки */}
											{hours.map((h) => {
												const gridLeft =
													((h * 60 - startMin) /
														Math.max(endMin - startMin, 1)) *
													100;
												return (
													<div
														key={h}
														className="pointer-events-none absolute inset-y-0 border-l border-border/40"
														style={{ left: `${gridLeft}%` }}
													/>
												);
											})}

											<button
												type="button"
												className={cn(
													"absolute top-1/2 z-10 min-h-[3rem] -translate-y-1/2 rounded-md border border-border bg-background px-2 py-1.5 text-left shadow-sm transition-colors",
													"hover:border-primary/40 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
												)}
												style={{
													left: `${left}%`,
													width: `${width}%`,
													minWidth: "4.5rem",
												}}
												onClick={() => onSlotClick(a.id)}
											>
												<p className="truncate text-xs font-medium">
													{timeRange}
												</p>
												{a.service?.name && (
													<p className="truncate text-[10px] text-muted-foreground">
														{a.service.name}
													</p>
												)}
												{diagnosis !== "—" && (
													<p className="mt-0.5 truncate text-[10px] text-muted-foreground">
														{diagnosis}
													</p>
												)}
												{roomDisplayName(a.room) && (
													<p className="text-[10px] text-muted-foreground">
														{roomDisplayName(a.room)}
													</p>
												)}
											</button>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
