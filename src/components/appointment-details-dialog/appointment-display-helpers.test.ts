import { describe, expect, it } from "vitest";

import {
	diagnosisToFormString,
	formatDiagnosisCode,
	formatDiagnosisDisplay,
	formatDiagnosisItemLabel,
	statusLabels,
} from "./appointment-display-helpers";

describe("diagnosisToFormString", () => {
	it("returns empty string for null and empty values", () => {
		expect(diagnosisToFormString(null)).toBe("");
		expect(diagnosisToFormString("")).toBe("");
	});

	it("returns string diagnosis unchanged", () => {
		expect(diagnosisToFormString("J06.9")).toBe("J06.9");
	});

	it("returns code from diagnosis object", () => {
		expect(diagnosisToFormString({ id: 1, code: "A00", name: "Холера", category: null })).toBe(
			"A00"
		);
	});
});

describe("formatDiagnosisCode", () => {
	it("strips seeder suffix from ICD code", () => {
		expect(formatDiagnosisCode("J06.9.b685.1")).toBe("J06.9");
		expect(formatDiagnosisCode("I10")).toBe("I10");
	});
});

describe("formatDiagnosisItemLabel", () => {
	it("formats code and name for UI", () => {
		expect(
			formatDiagnosisItemLabel({
				code: "J06.9.b685.1",
				name: "Острая инфекция верхних дыхательных путей неуточнённая",
			})
		).toBe("J06.9 — Острая инфекция верхних дыхательных путей неуточнённая");
	});
});

describe("formatDiagnosisDisplay", () => {
	it("formats object diagnosis or returns empty for missing values", () => {
		expect(
			formatDiagnosisDisplay({ id: 2, code: "J06.9", name: "ОРВИ", category: null })
		).toBe("J06.9 — ОРВИ");
		expect(formatDiagnosisDisplay(undefined)).toBe("");
	});
});

describe("statusLabels", () => {
	it("contains Russian labels for all appointment statuses", () => {
		expect(statusLabels.scheduled).toBe("Запланирован");
		expect(statusLabels.completed).toBe("Завершен");
		expect(statusLabels.available).toBe("Доступен");
		expect(Object.keys(statusLabels)).toHaveLength(7);
	});
});
