import type { Appointment, Diagnosis } from "@/api/types";
import { formatDiagnosisItemLabel } from "@/components/appointment-details-dialog/appointment-display-helpers";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { formatAppointmentDateTime } from "@/lib/appointment-time";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { patientShortName, roomDisplayName } from "./doctor-appointments-utils";

interface CompleteAppointmentDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	completeDialogEl: HTMLDivElement | null;
	dialogContentRef: (el: HTMLDivElement | null) => void;
	selectedAppointment: Appointment | null;
	selectedDiagnosis: Diagnosis | null;
	onSelectDiagnosis: (d: Diagnosis) => void;
	comboOpen: boolean;
	onComboOpenChange: (open: boolean) => void;
	diagnoses: Diagnosis[];
	submitting: boolean;
	onCancel: () => void;
	onConfirm: () => void;
}

export function CompleteAppointmentDialog({
	open,
	onOpenChange,
	completeDialogEl,
	dialogContentRef,
	selectedAppointment,
	selectedDiagnosis,
	onSelectDiagnosis,
	comboOpen,
	onComboOpenChange,
	diagnoses,
	submitting,
	onCancel,
	onConfirm,
}: CompleteAppointmentDialogProps) {
	const room = selectedAppointment
		? roomDisplayName(selectedAppointment.room)
		: null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent ref={dialogContentRef} className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Завершить приём</DialogTitle>
					<DialogDescription>
						Выберите диагноз по МКБ-10. Статус будет установлен «Завершён», пациент
						удалится из очереди.
					</DialogDescription>
				</DialogHeader>
				{selectedAppointment && (
					<div className="space-y-1.5 rounded-lg border bg-muted/40 p-3 text-sm">
						<p>
							<span className="text-muted-foreground">Время: </span>
							<span className="font-medium">
								{formatAppointmentDateTime(
									selectedAppointment.startTime,
									"dd.MM.yyyy HH:mm"
								)}
								{" — "}
								{formatAppointmentDateTime(selectedAppointment.endTime, "HH:mm")}
							</span>
						</p>
						<p>
							<span className="text-muted-foreground">Пациент: </span>
							<span className="font-medium">
								{patientShortName(selectedAppointment)}
							</span>
						</p>
						{selectedAppointment.service?.name && (
							<p>
								<span className="text-muted-foreground">Услуга: </span>
								{selectedAppointment.service.name}
							</p>
						)}
						{room && (
							<p>
								<span className="text-muted-foreground">Кабинет: </span>
								{room}
							</p>
						)}
					</div>
				)}
				<div className="space-y-2">
					<Label>Диагноз</Label>
					<Popover open={comboOpen} onOpenChange={onComboOpenChange} modal>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								role="combobox"
								aria-expanded={comboOpen}
								className="h-auto min-h-10 w-full justify-between gap-2 py-2 font-normal"
							>
								<span className="line-clamp-2 text-left">
									{selectedDiagnosis
										? formatDiagnosisItemLabel(selectedDiagnosis)
										: "Найти по коду или названию…"}
								</span>
								<ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
							</Button>
						</PopoverTrigger>
						<PopoverContent
							container={completeDialogEl}
							className="z-[100] w-[var(--radix-popover-trigger-width)] p-0"
							align="start"
						>
							<Command>
								<CommandInput placeholder="Поиск…" />
								<CommandList className="max-h-[min(16rem,50vh)]">
									<CommandEmpty>Не найдено</CommandEmpty>
									<CommandGroup>
										{diagnoses.map((d) => (
											<CommandItem
												key={d.id}
												value={`${formatDiagnosisItemLabel(d)} ${d.code}`}
												onSelect={() => {
													onSelectDiagnosis(d);
													onComboOpenChange(false);
												}}
											>
												<Check
													className={cn(
														"mr-2 h-4 w-4 shrink-0",
														selectedDiagnosis?.id === d.id
															? "opacity-100"
															: "opacity-0"
													)}
												/>
												<span className="truncate">
													{formatDiagnosisItemLabel(d)}
												</span>
											</CommandItem>
										))}
									</CommandGroup>
								</CommandList>
							</Command>
						</PopoverContent>
					</Popover>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={onCancel} disabled={submitting}>
						Отмена
					</Button>
					<Button onClick={onConfirm} disabled={submitting || !selectedDiagnosis}>
						{submitting ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							"Завершить приём"
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
