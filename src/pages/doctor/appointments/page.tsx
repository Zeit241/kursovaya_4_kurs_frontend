"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { formatUserFullName } from "@/lib/formatUserFullName";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { LayoutGrid, List, Loader2 } from "lucide-react";
import { useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
	useGetLiveQueueByDoctorQuery,
	useGetMyDoctorAppointmentsQuery,
} from "@/store/api/apiSlice";

import { DoctorAppointmentsTableCard } from "./doctor-appointments-table-card";
import { DoctorLiveQueueCard } from "./doctor-live-queue-card";
import { DoctorOccupiedSlotsBoard } from "./doctor-occupied-slots-board";

type ViewMode = "list" | "board";

function todayStr(): string {
	return format(new Date(), "yyyy-MM-dd");
}

function parseViewMode(value: string | null): ViewMode {
	return value === "board" ? "board" : "list";
}

export default function DoctorAppointmentsPage() {
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const { user, isLoading: authLoading } = useAuth();
	const doctorId = user?.doctorId ?? null;
	const dateStr = searchParams.get("date") ?? todayStr();
	const view = parseViewMode(searchParams.get("view"));

	const updateParams = useCallback(
		(next: { date?: string; view?: ViewMode }) => {
			const params: Record<string, string> = {};
			const date = next.date ?? dateStr;
			if (date) params.date = date;
			const mode = next.view ?? view;
			if (mode === "board") params.view = "board";
			setSearchParams(params);
		},
		[dateStr, view, setSearchParams]
	);

	const setDateStr = useCallback(
		(next: string) => updateParams({ date: next }),
		[updateParams]
	);

	const setView = useCallback(
		(next: ViewMode) => updateParams({ view: next }),
		[updateParams]
	);

	const {
		data: rawAppointments = [],
		isLoading: appointmentsLoading,
		isFetching: appointmentsFetching,
		refetch: refetchAppointments,
	} = useGetMyDoctorAppointmentsQuery(
		{ date: dateStr },
		{ skip: !doctorId, refetchOnMountOrArgChange: true }
	);

	const {
		data: liveQueue = [],
		isFetching: queueLoading,
		refetch: refetchQueue,
	} = useGetLiveQueueByDoctorQuery(
		{ doctorId: doctorId!, date: dateStr },
		{ skip: !doctorId, refetchOnMountOrArgChange: true }
	);

	const loading = appointmentsLoading || appointmentsFetching;
	const doctorName = formatUserFullName(user);

	if (authLoading) {
		return (
			<main className="flex-1 py-8">
				<div className="container mx-auto flex justify-center py-24">
					<Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
				</div>
			</main>
		);
	}

	if (!loading && doctorId === null) {
		return (
			<main className="flex-1 py-8">
				<div className="container mx-auto px-4">
					<Card>
						<CardHeader>
							<CardTitle>Нет доступа</CardTitle>
							<CardDescription>
								Войдите под учётной записью врача, привязанной к карточке
								специалиста.
							</CardDescription>
						</CardHeader>
					</Card>
				</div>
			</main>
		);
	}

	return (
		<main className="flex-1 py-8">
			<div className="container mx-auto px-4 space-y-8">
				<div>
					<h1 className="text-3xl font-bold gradient-heading">
						Приёмы врача
					</h1>
					{doctorName && (
						<p className="mt-1 text-sm text-muted-foreground">
							Вы вошли как: <span className="font-medium text-foreground">{doctorName}</span>
						</p>
					)}
					<p className="mt-2 text-muted-foreground">
						После завершения приёма очередь обновляется автоматически.
					</p>
				</div>

				<div className="flex flex-wrap items-end justify-between gap-4">
					<div className="flex flex-wrap items-end gap-4">
						<div className="space-y-2">
							<Label htmlFor="doctor-date">Дата</Label>
							<Input
								id="doctor-date"
								type="date"
								value={dateStr}
								onChange={(e) => setDateStr(e.target.value)}
							/>
						</div>
						<Button
							variant="secondary"
							onClick={() => {
								void refetchAppointments();
								void refetchQueue();
							}}
							disabled={loading || !doctorId}
						>
							Обновить
						</Button>
					</div>

					<div className="flex rounded-lg border p-1">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className={cn(
								"gap-1.5",
								view === "list" && "bg-muted shadow-sm"
							)}
							onClick={() => setView("list")}
						>
							<List className="h-4 w-4" />
							Список
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className={cn(
								"gap-1.5",
								view === "board" && "bg-muted shadow-sm"
							)}
							onClick={() => setView("board")}
						>
							<LayoutGrid className="h-4 w-4" />
							Шкала
						</Button>
					</div>
				</div>

				<div className="grid gap-6 lg:grid-cols-3">
					{view === "list" ? (
						<DoctorAppointmentsTableCard
							loading={loading}
							appointments={rawAppointments}
							onRowNavigate={(id) =>
								navigate(`/doctor/appointments/${id}?date=${dateStr}`)
							}
						/>
					) : (
						<DoctorOccupiedSlotsBoard
							loading={loading}
							appointments={rawAppointments}
							dateStr={dateStr}
							onSlotClick={(id) =>
								navigate(
									`/doctor/appointments/${id}?date=${dateStr}&view=board`
								)
							}
						/>
					)}
					<DoctorLiveQueueCard queueLoading={queueLoading} liveQueue={liveQueue} />
				</div>
			</div>
		</main>
	);
}
