import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	test: {
		coverage: {
			provider: "v8",
			include: [
				"src/lib/format-clinic-service-price.ts",
				"src/lib/mapLoginUser.ts",
				"src/lib/doctorPhotoSrc.ts",
				"src/store/api/**",
			],
			exclude: ["**/*.test.ts", "**/*.integration.test.ts", "src/test/**"],
			thresholds: {
				"src/lib/**": {
					lines: 80,
					branches: 80,
					statements: 80,
				},
				"src/store/api/**": {
					lines: 80,
					branches: 80,
					statements: 80,
				},
			},
		},
		projects: [
			{
				extends: true,
				test: {
					name: "unit",
					include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
					exclude: ["src/**/*.integration.test.ts"],
					environment: "jsdom",
					setupFiles: ["./src/test/setup.ts"],
				},
			},
			{
				extends: true,
				test: {
					name: "integration",
					include: ["src/**/*.integration.test.ts"],
					environment: "node",
					setupFiles: ["./src/test/setup.integration.ts"],
				},
			},
		],
	},
});
