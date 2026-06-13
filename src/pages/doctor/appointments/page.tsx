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
import { CalendarDays, LayoutGrid, List, Loader2 } from "lucide-react";
import { useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
	useGetLiveQueueByDoctorQuery,
	useGetMyDoctorSchedulePanelQuery,
} from "@/store/api/apiSlice";

import { DoctorAppointmentsTableCard } from "./doctor-appointments-table-card";
import { DoctorLiveQueueCard } from "./doctor-live-queue-card";
import { DoctorOccupiedSlotsBoard } from "./doctor-occupied-slots-board";
import { DoctorScheduleSummaryCard } from "./doctor-schedule-summary-card";
import {
	DOCTOR_STATUS_FILTER_OPTIONS,
	DoctorStatusFilter,
	type DoctorStatusFilterValue,
} from "./doctor-status-filter";
import { DoctorWeekScheduleBoard } from "./doctor-week-schedule-board";

type ViewMode = "list" | "board";
type PeriodMode = "day" | "week";

function todayStr(): string {
	return format(new Date(), "yyyy-MM-dd");
}

function parseViewMode(value: string | null): ViewMode {
	return value === "board" ? "board" : "list";
}

function parsePeriod(value: string | null): PeriodMode {
	return value === "week" ? "week" : "day";
}

function parseStatuses(value: string | null): DoctorStatusFilterValue[] {
	if (!value) return [];
	const allowed = new Set(DOCTOR_STATUS_FILTER_OPTIONS.map((o) => o.value));
	return value
		.split(",")
		.map((s) => s.trim())
		.filter((s): s is DoctorStatusFilterValue =>
			allowed.has(s as DoctorStatusFilterValue)
		);
}

export default function DoctorAppointmentsPage() {
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const { user, isLoading: authLoading } = useAuth();
	const doctorId = user?.doctorId ?? null;
	const dateStr = searchParams.get("date") ?? todayStr();
	const view = parseViewMode(searchParams.get("view"));
	const period = parsePeriod(searchParams.get("period"));
	const statuses = parseStatuses(searchParams.get("statuses"));

	const updateParams = useCallback(
		(next: {
			date?: string;
			view?: ViewMode;
			period?: PeriodMode;
			statuses?: DoctorStatusFilterValue[];
		}) => {
			const params: Record<string, string> = {};
			const date = next.date ?? dateStr;
			if (date) params.date = date;
			const mode = next.view ?? view;
			if (mode === "board") params.view = "board";
			const p = next.period ?? period;
			if (p === "week") params.period = "week";
			const st = next.statuses ?? statuses;
			if (st.length > 0) params.statuses = st.join(",");
			setSearchParams(params);
		},
		[dateStr, view, period, statuses, setSearchParams]
	);

	const setDateStr = useCallback(
		(next: string) => updateParams({ date: next }),
		[updateParams]
	);

	const setView = useCallback(
		(next: ViewMode) => updateParams({ view: next }),
		[updateParams]
	);

	const setPeriod = useCallback(
		(next: PeriodMode) => updateParams({ period: next }),
		[updateParams]
	);

	const setStatuses = useCallback(
		(next: DoctorStatusFilterValue[]) => updateParams({ statuses: next }),
		[updateParams]
	);

	const scheduleParams = useMemo(
		() => ({
			date: dateStr,
			view: period,
			status: statuses.length > 0 ? statuses.join(",") : undefined,
		}),
		[dateStr, period, statuses]
	);

	const {
		data: schedulePanel,
		isLoading: appointmentsLoading,
		isFetching: appointmentsFetching,
		refetch: refetchAppointments,
	} = useGetMyDoctorSchedulePanelQuery(scheduleParams, {
		skip: !doctorId,
		refetchOnMountOrArgChange: true,
	});

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
	const appointments = schedulePanel?.appointments ?? [];

	const statusCounts = useMemo(
		() => ({
			scheduled: schedulePanel?.scheduledCount ?? 0,
			in_progress: schedulePanel?.inProgressCount ?? 0,
			completed: schedulePanel?.completedCount ?? 0,
			cancelled: schedulePanel?.cancelledCount ?? 0,
		}),
		[schedulePanel]
	);

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
			<div className="container mx-auto px-4 space-y-6">
				<div>
					<h1 className="text-3xl font-bold gradient-heading">
						Панель врача
					</h1>
					{doctorName && (
						<p className="mt-1 text-sm text-muted-foreground">
							Вы вошли как:{" "}
							<span className="font-medium text-foreground">{doctorName}</span>
						</p>
					)}
					<p className="mt-2 text-muted-foreground">
						Персональное расписание с визуализацией дня и недели и фильтрацией
						по статусам приёмов.
					</p>
				</div>

				{schedulePanel && (
					<DoctorScheduleSummaryCard
						startDate={schedulePanel.startDate}
						endDate={schedulePanel.endDate}
						viewMode={period}
						scheduledCount={schedulePanel.scheduledCount}
						inProgressCount={schedulePanel.inProgressCount}
						completedCount={schedulePanel.completedCount}
						cancelledCount={schedulePanel.cancelledCount}
						totalCount={schedulePanel.totalCount}
					/>
				)}

				<div className="flex flex-wrap items-end justify-between gap-4">
					<div className="flex flex-wrap items-end gap-4">
						<div className="space-y-2">
							<Label htmlFor="doctor-date">
								{period === "week" ? "Неделя с даты" : "Дата"}
							</Label>
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

					<div className="flex flex-wrap gap-2">
						<div className="flex rounded-lg border p-1">
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className={cn(
									"gap-1.5",
									period === "day" && "bg-muted shadow-sm"
								)}
								onClick={() => setPeriod("day")}
							>
								<CalendarDays className="h-4 w-4" />
								День
							</Button>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className={cn(
									"gap-1.5",
									period === "week" && "bg-muted shadow-sm"
								)}
								onClick={() => setPeriod("week")}
							>
								<CalendarDays className="h-4 w-4" />
								Неделя
							</Button>
						</div>

						{period === "day" && (
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
						)}
					</div>
				</div>

				<DoctorStatusFilter
					selected={statuses}
					onChange={setStatuses}
					counts={statusCounts}
				/>

				<div className="grid gap-6 lg:grid-cols-3">
					{period === "week" ? (
						<DoctorWeekScheduleBoard
							loading={loading}
							appointments={appointments}
							startDate={schedulePanel?.startDate ?? dateStr}
							endDate={schedulePanel?.endDate ?? dateStr}
							onSlotClick={(id) =>
								navigate(
									`/doctor/appointments/${id}?date=${dateStr}&period=week`
								)
							}
						/>
					) : view === "list" ? (
						<DoctorAppointmentsTableCard
							loading={loading}
							appointments={appointments}
							onRowNavigate={(id) =>
								navigate(`/doctor/appointments/${id}?date=${dateStr}`)
							}
						/>
					) : (
						<DoctorOccupiedSlotsBoard
							loading={loading}
							appointments={appointments}
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
