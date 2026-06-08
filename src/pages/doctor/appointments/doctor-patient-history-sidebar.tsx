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
import { Separator } from "@/components/ui/separator";
import { formatAppointmentDate, formatAppointmentDateTime, appointmentTimeMs } from "@/lib/appointment-time";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

import { useGetAppointmentsByPatientQuery } from "@/store/api/apiSlice";
import { sortPatientAppointments } from "@/pages/admin/patients/sort-patient-appointments";

import {
	formatDiagnosisLabel,
	patientShortName,
	roomDisplayName,
	statusLabels,
} from "./doctor-appointments-utils";

interface DoctorPatientHistorySidebarProps {
	patientId: number | null | undefined;
	currentAppointmentId: number;
	appointment: Appointment;
}

function doctorDisplayName(a: Appointment): string {
	return (
		a.doctor?.displayName ||
		(a.doctor?.user
			? [a.doctor.user.lastName, a.doctor.user.firstName]
					.filter(Boolean)
					.join(" ")
			: "—")
	);
}

function VisitDetailPanel({ visit }: { visit: Appointment }) {
	return (
		<div className="space-y-3 text-sm">
			<div>
				<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
					Дата и время
				</p>
				<p className="mt-0.5 font-medium">
					{formatAppointmentDateTime(visit.startTime, "d MMMM yyyy, HH:mm")}
					{" — "}
					{formatAppointmentDateTime(visit.endTime, "HH:mm")}
				</p>
			</div>

			<div className="flex flex-wrap gap-2">
				<Badge variant="secondary">
					{statusLabels[visit.status] ?? visit.status}
				</Badge>
			</div>

			<Separator />

			<div className="space-y-2">
				<p>
					<span className="text-muted-foreground">Врач: </span>
					{doctorDisplayName(visit)}
				</p>
				{visit.service?.name && (
					<p>
						<span className="text-muted-foreground">Услуга: </span>
						{visit.service.name}
					</p>
				)}
				{roomDisplayName(visit.room) && (
					<p>
						<span className="text-muted-foreground">Кабинет: </span>
						{roomDisplayName(visit.room)}
					</p>
				)}
				<p>
					<span className="text-muted-foreground">Диагноз: </span>
					{formatDiagnosisLabel(visit)}
				</p>
			</div>

			{(visit.complaints || visit.anamnesis || visit.recommendations) && (
				<>
					<Separator />
					<div className="space-y-3">
						{visit.complaints && (
							<div>
								<p className="text-xs font-medium text-muted-foreground">
									Жалобы
								</p>
								<p className="mt-1 whitespace-pre-wrap">{visit.complaints}</p>
							</div>
						)}
						{visit.anamnesis && (
							<div>
								<p className="text-xs font-medium text-muted-foreground">
									Анамнез
								</p>
								<p className="mt-1 whitespace-pre-wrap">{visit.anamnesis}</p>
							</div>
						)}
						{visit.recommendations && (
							<div>
								<p className="text-xs font-medium text-muted-foreground">
									Назначения
								</p>
								<p className="mt-1 whitespace-pre-wrap">
									{visit.recommendations}
								</p>
							</div>
						)}
					</div>
				</>
			)}

			{visit.status === "cancelled" && visit.cancelReason && (
				<>
					<Separator />
					<div>
						<p className="text-xs font-medium text-muted-foreground">
							Причина отмены
						</p>
						<p className="mt-1 whitespace-pre-wrap">{visit.cancelReason}</p>
					</div>
				</>
			)}
		</div>
	);
}

export function DoctorPatientHistorySidebar({
	patientId,
	currentAppointmentId,
	appointment,
}: DoctorPatientHistorySidebarProps) {
	const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null);

	const { data: rawHistory = [], isLoading } = useGetAppointmentsByPatientQuery(
		patientId ?? 0,
		{ skip: patientId == null }
	);

	const pastVisits = useMemo(() => {
		const now = Date.now();
		const filtered = rawHistory.filter((a) => {
			if (a.id === currentAppointmentId) return false;
			const isPast = appointmentTimeMs(a.startTime) < now;
			const isTerminal = ["completed", "cancelled", "no_show"].includes(
				a.status
			);
			return isPast || isTerminal;
		});
		return sortPatientAppointments(filtered).reverse();
	}, [rawHistory, currentAppointmentId]);

	const selectedVisit = useMemo(
		() => pastVisits.find((v) => v.id === selectedVisitId) ?? null,
		[pastVisits, selectedVisitId]
	);

	return (
		<aside className="w-full shrink-0 lg:w-72 xl:w-80">
			<Card className="sticky top-20 overflow-hidden">
				<CardHeader className="pb-3">
					<CardTitle className="text-base">Пациент</CardTitle>
					<CardDescription className="font-medium text-foreground">
						{patientShortName(appointment) || "—"}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
							Прошлые визиты
						</h3>

						{isLoading ? (
							<div className="flex justify-center py-8">
								<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
							</div>
						) : pastVisits.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								Ранее зафиксированных визитов нет
							</p>
						) : (
							<nav aria-label="История визитов" className="relative">
								<ul className="space-y-0">
									{pastVisits.map((visit, index) => {
										const isSelected = selectedVisitId === visit.id;
										const isLast = index === pastVisits.length - 1;
										const stepNum = pastVisits.length - index;

										return (
											<li key={visit.id} className="relative">
												{!isLast && (
													<span
														className="absolute left-[11px] top-7 bottom-0 w-px bg-border"
														aria-hidden
													/>
												)}
												<button
													type="button"
													onClick={() =>
														setSelectedVisitId(
															isSelected ? null : visit.id
														)
													}
													className={cn(
														"relative flex w-full gap-3 rounded-md pb-5 text-left transition-colors",
														isLast && "pb-0",
														isSelected
															? "bg-muted/60"
															: "hover:bg-muted/40"
													)}
												>
													<span
														className={cn(
															"relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-semibold",
															isSelected
																? "border-primary bg-primary text-primary-foreground"
																: "border-border bg-background text-muted-foreground"
														)}
													>
														{stepNum}
													</span>
													<span className="min-w-0 flex-1 pt-0.5">
														<span className="block text-sm font-medium leading-tight">
															{formatAppointmentDate(visit.startTime, "d MMM yyyy")}
														</span>
														<span className="block text-xs text-muted-foreground">
															{formatAppointmentDateTime(visit.startTime, "HH:mm")}
															{" — "}
															{formatAppointmentDateTime(visit.endTime, "HH:mm")}
														</span>
														<Badge
															variant="outline"
															className="mt-1.5 text-[10px] font-normal"
														>
															{statusLabels[visit.status] ??
																visit.status}
														</Badge>
													</span>
												</button>
											</li>
										);
									})}
								</ul>
							</nav>
						)}
					</div>

					{selectedVisit && (
						<>
							<Separator />
							<div>
								<h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
									Данные визита
								</h3>
								<VisitDetailPanel visit={selectedVisit} />
							</div>
						</>
					)}

					{!selectedVisit && pastVisits.length > 0 && !isLoading && (
						<p className="text-xs text-muted-foreground">
							Выберите шаг, чтобы посмотреть данные прошлого приёма
						</p>
					)}
				</CardContent>
			</Card>
		</aside>
	);
}
