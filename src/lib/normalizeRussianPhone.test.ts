import { describe, expect, it } from "vitest";

import {
	isValidRussianPhoneDisplay,
	normalizeRussianPhoneDisplay,
} from "./normalizeRussianPhone";

describe("normalizeRussianPhoneDisplay", () => {
	it("formats compact +7 number", () => {
		expect(normalizeRussianPhoneDisplay("+799641753631")).toBe(
			"+7 (996) 417-53-63",
		);
	});

	it("formats 8-prefixed number", () => {
		expect(normalizeRussianPhoneDisplay("89964175363")).toBe(
			"+7 (996) 417-53-63",
		);
	});

	it("keeps already formatted value", () => {
		expect(normalizeRussianPhoneDisplay("+7 (996) 417-53-63")).toBe(
			"+7 (996) 417-53-63",
		);
	});

	it("validates formatted phone", () => {
		expect(isValidRussianPhoneDisplay("+7 (996) 417-53-63")).toBe(true);
		expect(isValidRussianPhoneDisplay("+799641753631")).toBe(false);
	});
});
