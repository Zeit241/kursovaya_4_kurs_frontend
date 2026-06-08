import { describe, expect, it } from "vitest";

import {
	formatClinicServicePrice,
	formatClinicServicePriceFromFields,
	parseClinicPrice,
} from "./format-clinic-service-price";

describe("parseClinicPrice", () => {
	it("returns NaN for null and undefined", () => {
		expect(Number.isNaN(parseClinicPrice(null))).toBe(true);
		expect(Number.isNaN(parseClinicPrice(undefined))).toBe(true);
	});

	it("returns the same finite number for numeric input", () => {
		expect(parseClinicPrice(1500)).toBe(1500);
	});

	it("parses comma decimal strings", () => {
		expect(parseClinicPrice("1500,50")).toBe(1500.5);
	});
});

describe("formatClinicServicePriceFromFields", () => {
	it('returns em dash for zero, negative, and invalid prices', () => {
		expect(formatClinicServicePriceFromFields(0)).toBe("—");
		expect(formatClinicServicePriceFromFields(-100)).toBe("—");
		expect(formatClinicServicePriceFromFields("abc")).toBe("—");
	});

	it("formats positive numeric and string prices in RUB", () => {
		expect(formatClinicServicePriceFromFields(1500)).toContain("1");
		expect(formatClinicServicePriceFromFields("2500,00")).not.toBe("—");
	});
});

describe("formatClinicServicePrice", () => {
	it("delegates to formatClinicServicePriceFromFields via service.price", () => {
		expect(formatClinicServicePrice({ price: 500 })).toBe(
			formatClinicServicePriceFromFields(500)
		);
		expect(formatClinicServicePrice({ price: null })).toBe("—");
	});
});
