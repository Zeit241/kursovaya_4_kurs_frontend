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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { formatAppointmentDateTime } from "@/lib/appointment-time";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";
import {
	formatDiagnosisLabel,
	patientShortName,
	statusLabels,
} from "./doctor-appointments-utils";

interface DoctorAppointmentsTableCardProps {
	loading: boolean;
	appointments: Appointment[];
	onRowNavigate: (appointmentId: number) => void;
}

export function DoctorAppointmentsTableCard({
	loading,
	appointments,
	onRowNavigate,
}: DoctorAppointmentsTableCardProps) {
	const booked = useMemo(
		() =>
			[...appointments]
				.filter((x) => x.patientId != null)
				.sort(
					(a, b) =>
						new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
				),
		[appointments]
	);

	return (
		<Card className="lg:col-span-2">
			<CardHeader>
				<CardTitle>Записи на выбранный день</CardTitle>
				<CardDescription>Только слоты с назначенным пациентом</CardDescription>
			</CardHeader>
			<CardContent>
				{loading ? (
					<div className="flex justify-center py-12">
						<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
					</div>
				) : booked.length === 0 ? (
					<p className="text-muted-foreground">Нет приёмов на эту дату</p>
				) : (
					<div className="rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Время</TableHead>
									<TableHead>Пациент</TableHead>
									<TableHead>Статус</TableHead>
									<TableHead>Диагноз</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{booked.map((a) => (
									<TableRow
										key={a.id}
										className="cursor-pointer hover:bg-muted/50"
										onClick={() => onRowNavigate(a.id)}
									>
										<TableCell className="whitespace-nowrap">
											{formatAppointmentDateTime(a.startTime, "HH:mm")}
											{" — "}
											{formatAppointmentDateTime(a.endTime, "HH:mm")}
										</TableCell>
										<TableCell>{patientShortName(a)}</TableCell>
										<TableCell>
											<Badge variant="secondary">
												{statusLabels[a.status] ?? a.status}
											</Badge>
										</TableCell>
										<TableCell className="max-w-[220px] truncate text-sm">
											{formatDiagnosisLabel(a)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
