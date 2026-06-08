import { describe, expect, it } from "vitest";

import {
	doctorsQueryParams,
	isAuthPath,
	unwrapEntity,
	unwrapList,
} from "./utils";

describe("unwrapList", () => {
	it("returns array data, ApiResponse.data, or empty array", () => {
		const items = [{ id: 1 }, { id: 2 }];
		expect(unwrapList(items)).toEqual(items);
		expect(unwrapList({ success: true, data: [{ id: 3 }], message: "", status: 200 })).toEqual([
			{ id: 3 },
		]);
		expect(unwrapList(null)).toEqual([]);
	});
});

describe("unwrapEntity", () => {
	it("returns entity, unwraps ApiResponse.data, or throws", () => {
		const entity = { id: 7, name: "Test" };
		expect(unwrapEntity(entity, "not found")).toEqual(entity);
		expect(
			unwrapEntity({ success: true, data: { id: 8 }, message: "", status: 200 }, "x")
		).toEqual({ id: 8 });
		expect(() =>
			unwrapEntity({ success: false, message: "fail", data: null, status: 404 }, "fallback")
		).toThrow("fail");
	});
});

describe("doctorsQueryParams and isAuthPath", () => {
	it("builds trimmed doctor query params", () => {
		expect(doctorsQueryParams({ q: "  ivan  ", serviceId: 5, limit: 10 })).toEqual({
			q: "ivan",
			serviceId: 5,
			limit: 10,
		});
		expect(doctorsQueryParams(undefined)).toBeUndefined();
	});

	it("detects auth-related URL fragments", () => {
		expect(isAuthPath("/api/auth/login")).toBe(true);
		expect(isAuthPath("auth/register")).toBe(true);
		expect(isAuthPath("users/register-with-patient")).toBe(true);
		expect(isAuthPath("users/1")).toBe(false);
	});
});
