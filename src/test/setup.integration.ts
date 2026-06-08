import "./setup";
import { afterAll, afterEach, beforeAll } from "vitest";

import { server } from "./msw/server";

const integrationStorage = new Map<string, string>();

beforeAll(() => {
	Object.defineProperty(globalThis, "localStorage", {
		value: {
			getItem: (key: string) => integrationStorage.get(key) ?? null,
			setItem: (key: string, value: string) => {
				integrationStorage.set(key, value);
			},
			removeItem: (key: string) => {
				integrationStorage.delete(key);
			},
			clear: () => {
				integrationStorage.clear();
			},
		},
		configurable: true,
	});

	server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
	integrationStorage.clear();
	server.resetHandlers();
});

afterAll(() => server.close());
