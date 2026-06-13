"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const DOCTOR_STATUS_FILTER_OPTIONS = [
	{ value: "scheduled", label: "Запланирован" },
	{ value: "in_progress", label: "В процессе" },
	{ value: "completed", label: "Завершён" },
	{ value: "cancelled", label: "Отменён" },
] as const;

export type DoctorStatusFilterValue =
	(typeof DOCTOR_STATUS_FILTER_OPTIONS)[number]["value"];

interface DoctorStatusFilterProps {
	selected: DoctorStatusFilterValue[];
	onChange: (next: DoctorStatusFilterValue[]) => void;
	counts?: Partial<Record<DoctorStatusFilterValue, number>>;
}

export function DoctorStatusFilter({
	selected,
	onChange,
	counts,
}: DoctorStatusFilterProps) {
	const toggle = (value: DoctorStatusFilterValue) => {
		if (selected.includes(value)) {
			onChange(selected.filter((s) => s !== value));
		} else {
			onChange([...selected, value]);
		}
	};

	return (
		<div className="flex flex-wrap items-center gap-2">
			<span className="text-sm text-muted-foreground">Статусы:</span>
			{DOCTOR_STATUS_FILTER_OPTIONS.map((opt) => {
				const active = selected.includes(opt.value);
				const count = counts?.[opt.value];
				return (
					<Button
						key={opt.value}
						type="button"
						variant={active ? "default" : "outline"}
						size="sm"
						className={cn("h-8 gap-1.5", !active && "bg-background")}
						onClick={() => toggle(opt.value)}
					>
						{opt.label}
						{typeof count === "number" && (
							<Badge
								variant="secondary"
								className="h-5 min-w-5 px-1 text-[10px]"
							>
								{count}
							</Badge>
						)}
					</Button>
				);
			})}
			{selected.length > 0 && (
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="h-8 text-muted-foreground"
					onClick={() => onChange([])}
				>
					Сбросить
				</Button>
			)}
		</div>
	);
}
