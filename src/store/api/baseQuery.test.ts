import { configureStore } from "@reduxjs/toolkit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "./apiSlice";
import { baseQueryWithReauth } from "./baseQuery";

function createTestStore() {
	return configureStore({
		reducer: { [api.reducerPath]: api.reducer },
		middleware: (gDM) => gDM().concat(api.middleware),
	});
}

function getFetchHeaders(callIndex = 0): Headers {
	const call = vi.mocked(fetch).mock.calls[callIndex];
	if (!call) throw new Error("fetch was not called");
	const input = call[0];
	if (input instanceof Request) return input.headers;
	const init = call[1] as RequestInit | undefined;
	return new Headers(init?.headers);
}

describe("baseQueryWithReauth", () => {
	const locationMock = { href: "" };

	beforeEach(() => {
		localStorage.clear();
		vi.stubGlobal("fetch", vi.fn());
		locationMock.href = "";
		vi.stubGlobal("location", locationMock);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("adds Authorization header when token is stored", async () => {
		localStorage.setItem("token", "jwt-123");
		vi.mocked(fetch).mockResolvedValue(
			new Response(JSON.stringify({ ok: true }), { status: 200 })
		);

		const store = createTestStore();
		await baseQueryWithReauth("users", store as never, {});

		const headers = getFetchHeaders();
		expect(headers.get("Authorization")).toBe("Bearer jwt-123");
	});

	it("sets Content-Type to application/json", async () => {
		vi.mocked(fetch).mockResolvedValue(
			new Response(JSON.stringify({ ok: true }), { status: 200 })
		);

		const store = createTestStore();
		await baseQueryWithReauth("users", store as never, {});

		const headers = getFetchHeaders();
		expect(headers.get("Content-Type")).toBe("application/json");
	});

	it("returns successful response data", async () => {
		const payload = { success: true, data: [{ id: 1 }] };
		vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(payload), { status: 200 }));

		const store = createTestStore();
		const result = await baseQueryWithReauth("users", store as never, {});

		expect(result.data).toEqual(payload);
		expect(result.error).toBeUndefined();
	});

	it("clears auth and redirects on 401 for protected routes", async () => {
		localStorage.setItem("token", "expired");
		localStorage.setItem("user", "{}");
		vi.mocked(fetch).mockResolvedValue(
			new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
		);

		const store = createTestStore();
		await baseQueryWithReauth("users/1", store as never, {});

		expect(localStorage.getItem("token")).toBeNull();
		expect(localStorage.getItem("user")).toBeNull();
		expect(locationMock.href).toBe("/auth/login");
	});

	it("does not redirect on 401 for auth/login", async () => {
		localStorage.setItem("token", "bad");
		vi.mocked(fetch).mockResolvedValue(
			new Response(JSON.stringify({ message: "Bad credentials" }), { status: 401 })
		);

		const store = createTestStore();
		await baseQueryWithReauth(
			{ url: "auth/login", method: "POST", body: { email: "a", password: "b" } },
			store as never,
			{}
		);

		expect(localStorage.getItem("token")).toBe("bad");
		expect(locationMock.href).toBe("");
	});

	it("does not redirect on 401 for register-with-patient path", async () => {
		localStorage.setItem("token", "bad");
		vi.mocked(fetch).mockResolvedValue(new Response("{}", { status: 401 }));

		const store = createTestStore();
		await baseQueryWithReauth("auth/register-with-patient", store as never, {});

		expect(locationMock.href).toBe("");
	});
});
