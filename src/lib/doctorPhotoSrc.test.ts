import { afterEach, describe, expect, it, vi } from "vitest";

import { doctorPhotoImgSrc } from "./doctorPhotoSrc";

describe("doctorPhotoImgSrc", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("returns null for empty or whitespace-only input", () => {
		expect(doctorPhotoImgSrc(null)).toBeNull();
		expect(doctorPhotoImgSrc("   ")).toBeNull();
	});

	it("returns data URLs unchanged and encodes raw base64 payloads", () => {
		const dataUrl = "data:image/png;base64,abc";
		expect(doctorPhotoImgSrc(dataUrl)).toBe(dataUrl);
		expect(doctorPhotoImgSrc("iVBORw0KGgo")).toBe("data:image/png;base64,iVBORw0KGgo");
		expect(doctorPhotoImgSrc("/9j/abc")).toBe("data:image/jpeg;base64,/9j/abc");
	});

	it("builds Directus asset URL from UUID and base", () => {
		vi.stubEnv("VITE_DIRECTUS_STATIC_TOKEN", "");
		const uuid = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
		const src = doctorPhotoImgSrc(uuid, "https://directus.example.com");
		expect(src).toBe(`https://directus.example.com/assets/${uuid}?format=webp`);
	});

	it("appends access_token to http asset URLs when env token is set", () => {
		vi.stubEnv("VITE_DIRECTUS_STATIC_TOKEN", "secret-token");
		const url = "https://directus.example.com/assets/file-id";
		const src = doctorPhotoImgSrc(url);
		expect(src).toContain("access_token=secret-token");
	});
});
