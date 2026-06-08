import type { Appointment } from "@/api/types";

export function diagnosisToFormString(d: Appointment["diagnosis"]): string {
	if (d == null || d === "") return "";
	if (typeof d === "string") return d;
	return d.code || String(d.id ?? "");
}

/** Убирает технический суффикс сидера (`.abcd.0`) с кода МКБ для отображения. */
export function formatDiagnosisCode(code: string | null | undefined): string {
	if (!code?.trim()) return "";
	const trimmed = code.trim();
	return trimmed.replace(/\.[a-z0-9]{4}\.\d+$/i, "") || trimmed;
}

export function formatDiagnosisItemLabel(d: {
	code: string;
	name: string;
}): string {
	const code = formatDiagnosisCode(d.code);
	const name = d.name?.trim() ?? "";
	return name ? `${code} — ${name}` : code;
}

export function formatDiagnosisDisplay(d: Appointment["diagnosis"]): string {
	if (d == null || d === "") return "";
	if (typeof d === "string") return d;
	if (typeof d === "object" && "code" in d) {
		return formatDiagnosisItemLabel({
			code: d.code,
			name: d.name ?? "",
		});
	}
	return "";
}

export const statusLabels: Record<Appointment["status"], string> = {
	scheduled: "Запланирован",
	confirmed: "Подтвержден",
	in_progress: "В процессе",
	completed: "Завершен",
	cancelled: "Отменен",
	no_show: "Неявка",
	available: "Доступен",
};
