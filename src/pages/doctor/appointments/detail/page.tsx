"use client";

import type { Appointment, Diagnosis, UpdateAppointmentRequest } from "@/api/types";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatAppointmentDateTime } from "@/lib/appointment-time";
import { ArrowLeft, Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import {
	useCompleteAppointmentMutation,
	useGetAppointmentByIdQuery,
	useGetDiagnosesQuery,
	useUpdateAppointmentMutation,
} from "@/store/api/apiSlice";

import { formatDiagnosisItemLabel } from "@/components/appointment-details-dialog/appointment-display-helpers";
import { CompleteAppointmentDialog } from "../complete-appointment-dialog";
import { DoctorPatientHistorySidebar } from "../doctor-patient-history-sidebar";
import { terminalStatuses, patientShortName, roomDisplayName } from "../doctor-appointments-utils";

const statusLabels: Record<string, string> = {
	scheduled: "Запланирован",
	confirmed: "Подтверждён",
	in_progress: "В процессе",
	completed: "Завершён",
	cancelled: "Отменён",
	no_show: "Неявка",
	available: "Слот",
};

const statusValues = [
	"scheduled",
	"confirmed",
	"in_progress",
	"completed",
	"cancelled",
	"no_show",
] as const;

function diagnosisFromAppointment(a: Appointment): Diagnosis | null {
	const d = a.diagnosis;
	if (d == null || typeof d === "string") return null;
	if (typeof d === "object" && "id" in d && "code" in d) {
		return {
			id: d.id,
			code: d.code,
			name: d.name,
			category: d.category ?? null,
		};
	}
	return null;
}

export default function DoctorAppointmentDetailPage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const appointmentId = id ? Number.parseInt(id, 10) : NaN;
	const returnDate = searchParams.get("date");
	const returnView = searchParams.get("view");
	const listPath =
		returnDate || returnView
			? `/doctor/appointments?${new URLSearchParams({
					...(returnDate ? { date: returnDate } : {}),
					...(returnView === "board" ? { view: "board" } : {}),
				}).toString()}`
			: "/doctor/appointments";

	const [saving, setSaving] = useState(false);
	const [appointment, setAppointment] = useState<Appointment | null>(null);
	const finiteId = Number.isFinite(appointmentId);
	const {
		data: apptFromQuery,
		isLoading: loading,
		refetch,
	} = useGetAppointmentByIdQuery(appointmentId, { skip: !finiteId });
	const { data: diagnoses = [] } = useGetDiagnosesQuery();
	const [updateAppointmentMut] = useUpdateAppointmentMutation();
	const [completeAppointmentMut] = useCompleteAppointmentMutation();

	const [status, setStatus] = useState<string>("scheduled");
	const [complaints, setComplaints] = useState("");
	const [anamnesis, setAnamnesis] = useState("");
	const [recommendations, setRecommendations] = useState("");
	const [cancelReason, setCancelReason] = useState("");
	const [selectedDiagnosis, setSelectedDiagnosis] = useState<Diagnosis | null>(null);
	const [comboOpen, setComboOpen] = useState(false);

	const [completeOpen, setCompleteOpen] = useState(false);
	const [completeDiagnosis, setCompleteDiagnosis] = useState<Diagnosis | null>(null);
	const [completeComboOpen, setCompleteComboOpen] = useState(false);
	const [completing, setCompleting] = useState(false);
	const [completeDialogEl, setCompleteDialogEl] = useState<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!finiteId || loading) return;
		if (!apptFromQuery) {
			setAppointment(null);
			return;
		}
		const a = apptFromQuery;
		setAppointment(a);
		setStatus(a.status);
		setComplaints(a.complaints ?? "");
		setAnamnesis(a.anamnesis ?? "");
		setRecommendations(a.recommendations ?? "");
		setCancelReason(a.cancelReason ?? "");
		const d0 = diagnosisFromAppointment(a);
		if (d0) {
			setSelectedDiagnosis(d0);
		} else if (a.diagnosisId != null) {
			const found = diagnoses.find((x) => x.id === a.diagnosisId);
			setSelectedDiagnosis(found ?? null);
		} else {
			setSelectedDiagnosis(null);
		}
	}, [apptFromQuery, diagnoses, finiteId, loading]);

	const handleSave = async () => {
		if (!Number.isFinite(appointmentId) || !appointment) return;
		try {
			setSaving(true);
			const updated = await updateAppointmentMut({
				id: appointmentId,
				body: {
					status: status as UpdateAppointmentRequest["status"],
					complaints: complaints.trim() || null,
					anamnesis: anamnesis.trim() || null,
					recommendations: recommendations.trim() || null,
					cancelReason: status === "cancelled" ? cancelReason.trim() || null : null,
					diagnosisId: selectedDiagnosis?.id ?? null,
				},
			}).unwrap();
			setAppointment(updated);
			void refetch();
			toast.success("Сохранено");
		} catch (e) {
			console.error(e);
			toast.error("Не удалось сохранить");
		} finally {
			setSaving(false);
		}
	};

	const openComplete = () => {
		setCompleteDiagnosis(selectedDiagnosis);
		setCompleteOpen(true);
	};

	const handleComplete = async () => {
		if (!appointment || !completeDiagnosis) {
			toast.error("Выберите диагноз из справочника МКБ");
			return;
		}
		try {
			setCompleting(true);
			const res = await completeAppointmentMut({
				id: appointment.id,
				body: { diagnosisId: completeDiagnosis.id },
			}).unwrap();
			toast.success(res.message || "Приём завершён");
			setCompleteOpen(false);
			setCompleteDiagnosis(null);
			void refetch();
		} catch (e) {
			console.error(e);
			toast.error("Не удалось завершить приём");
		} finally {
			setCompleting(false);
		}
	};

	const canComplete = appointment && !terminalStatuses.has(appointment.status);

	if (!Number.isFinite(appointmentId)) {
		return (
			<main className="flex-1 py-8">
				<div className="container mx-auto px-4">
					<p className="text-muted-foreground">Некорректный идентификатор</p>
					<Button asChild variant="link" className="mt-2 px-0">
						<Link to={listPath}>К списку приёмов</Link>
					</Button>
				</div>
			</main>
		);
	}

	if (loading) {
		return (
			<main className="flex-1 py-8">
				<div className="container mx-auto flex justify-center py-24">
					<Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
				</div>
			</main>
		);
	}

	if (!appointment) {
		return (
			<main className="flex-1 py-8">
				<div className="container mx-auto px-4">
					<p className="text-muted-foreground">Приём не найден или нет доступа</p>
					<Button asChild variant="link" className="mt-2 px-0">
						<Link to={listPath}>К списку приёмов</Link>
					</Button>
				</div>
			</main>
		);
	}

	return (
		<main className="flex-1 py-8">
			<div className="container mx-auto max-w-6xl px-4">
				<div className="mb-6 flex flex-wrap items-center gap-3">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="gap-1 pl-0"
						onClick={() => navigate(listPath)}
					>
						<ArrowLeft className="h-4 w-4" />
						К списку приёмов
					</Button>
				</div>

				<div className="flex flex-col gap-6 lg:flex-row lg:items-start">
					<DoctorPatientHistorySidebar
						patientId={appointment.patientId}
						currentAppointmentId={appointment.id}
						appointment={appointment}
					/>

					<div className="min-w-0 flex-1 space-y-6">
						<div>
							<h1 className="text-2xl font-bold gradient-heading">
								Карточка приёма
							</h1>
							<p className="mt-1 text-sm text-muted-foreground">
								{patientShortName(appointment)}
								{" · "}
								{formatAppointmentDateTime(appointment.startTime, "dd.MM.yyyy HH:mm")}
								{" — "}
								{formatAppointmentDateTime(appointment.endTime, "HH:mm")}
							</p>
						</div>

				<Card>
					<CardHeader>
						<CardTitle>Слот</CardTitle>
						<CardDescription>Только для просмотра</CardDescription>
					</CardHeader>
					<CardContent className="space-y-2 text-sm">
						{appointment.service?.name && (
							<p>
								<span className="text-muted-foreground">Услуга: </span>
								{appointment.service.name}
							</p>
						)}
						{roomDisplayName(appointment.room) && (
							<p>
								<span className="text-muted-foreground">Кабинет: </span>
								{roomDisplayName(appointment.room)}
							</p>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Медицинская информация</CardTitle>
						<CardDescription>Жалобы, анамнез, назначения</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="complaints">Жалобы (со слов пациента)</Label>
							<Textarea
								id="complaints"
								value={complaints}
								onChange={(e) => setComplaints(e.target.value)}
								rows={4}
								placeholder="Текст жалоб…"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="anamnesis">Анамнез</Label>
							<Textarea
								id="anamnesis"
								value={anamnesis}
								onChange={(e) => setAnamnesis(e.target.value)}
								rows={4}
								placeholder="Заболевание, жизнь, перенесённые заболевания…"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="recommendations">Назначения и план лечения</Label>
							<Textarea
								id="recommendations"
								value={recommendations}
								onChange={(e) => setRecommendations(e.target.value)}
								rows={4}
								placeholder="Рекомендации, препараты, контроль…"
							/>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Статус и диагноз</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label>Статус</Label>
							<Select value={status} onValueChange={setStatus}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{statusValues.map((s) => (
										<SelectItem key={s} value={s}>
											{statusLabels[s] ?? s}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label>Диагноз (МКБ-10)</Label>
							<Popover open={comboOpen} onOpenChange={setComboOpen}>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										role="combobox"
										aria-expanded={comboOpen}
										className="w-full justify-between font-normal"
									>
										{selectedDiagnosis
											? formatDiagnosisItemLabel(selectedDiagnosis)
											: "Выберите или найдите…"}
										<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
									<Command>
										<CommandInput placeholder="Поиск…" />
										<CommandList>
											<CommandEmpty>Не найдено</CommandEmpty>
											<CommandGroup>
												<CommandItem
													value="__clear__"
													onSelect={() => {
														setSelectedDiagnosis(null);
														setComboOpen(false);
													}}
												>
													<span className="text-muted-foreground">Без диагноза</span>
												</CommandItem>
												{diagnoses.map((d) => (
													<CommandItem
														key={d.id}
														value={`${d.code} ${d.name}`}
														onSelect={() => {
															setSelectedDiagnosis(d);
															setComboOpen(false);
														}}
													>
														<Check
															className={cn(
																"mr-2 h-4 w-4",
																selectedDiagnosis?.id === d.id
																	? "opacity-100"
																	: "opacity-0"
															)}
														/>
														{formatDiagnosisItemLabel(d)}
													</CommandItem>
												))}
											</CommandGroup>
										</CommandList>
									</Command>
								</PopoverContent>
							</Popover>
						</div>

						{status === "cancelled" && (
							<div className="space-y-2 rounded-md border border-destructive/30 bg-destructive/5 p-4">
								<Label htmlFor="cancel-reason">Причина отмены</Label>
								<Textarea
									id="cancel-reason"
									value={cancelReason}
									onChange={(e) => setCancelReason(e.target.value)}
									rows={2}
									placeholder="Укажите причину отмены приёма"
								/>
							</div>
						)}
					</CardContent>
				</Card>

				<div className="flex flex-wrap gap-3 pb-8">
					<Button type="button" onClick={handleSave} disabled={saving}>
						{saving ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Сохранение…
							</>
						) : (
							"Сохранить"
						)}
					</Button>
					{canComplete && (
						<Button type="button" variant="default" onClick={openComplete}>
							Завершить приём
						</Button>
					)}
				</div>
					</div>
				</div>
			</div>

			<CompleteAppointmentDialog
				open={completeOpen}
				onOpenChange={setCompleteOpen}
				completeDialogEl={completeDialogEl}
				dialogContentRef={setCompleteDialogEl}
				selectedAppointment={appointment}
				selectedDiagnosis={completeDiagnosis}
				onSelectDiagnosis={setCompleteDiagnosis}
				comboOpen={completeComboOpen}
				onComboOpenChange={setCompleteComboOpen}
				diagnoses={diagnoses}
				submitting={completing}
				onCancel={() => setCompleteOpen(false)}
				onConfirm={handleComplete}
			/>
		</main>
	);
}
