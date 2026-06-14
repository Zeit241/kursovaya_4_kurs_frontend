import * as z from "zod";

/** Формат для PatternFormat: +7 (XXX) XXX-XX-XX */
export const RUSSIAN_PHONE_DISPLAY_REGEX =
	/^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/;

/** Приводит ввод (+7999…, 8999…, уже отформатированный) к +7 (XXX) XXX-XX-XX. */
export function normalizeRussianPhoneDisplay(
	value: string | undefined | null,
): string {
	if (!value?.trim()) return "";

	const digits = value.replace(/\D/g, "");
	let national = "";

	if (digits.length >= 11 && (digits.startsWith("7") || digits.startsWith("8"))) {
		national = digits.slice(1, 11);
	} else if (digits.length === 10) {
		national = digits;
	} else {
		return value.trim();
	}

	if (national.length !== 10) {
		return value.trim();
	}

	return `+7 (${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6, 8)}-${national.slice(8, 10)}`;
}

export function isValidRussianPhoneDisplay(value: string): boolean {
	return RUSSIAN_PHONE_DISPLAY_REGEX.test(value);
}

/** Опциональный телефон: без transform, чтобы z.infer сохранял string | undefined. */
export const optionalRussianPhoneSchema = z
	.string()
	.optional()
	.refine(
		(val) => {
			if (!val?.trim()) return true;
			return isValidRussianPhoneDisplay(normalizeRussianPhoneDisplay(val));
		},
		{ message: "Неверный формат телефона" },
	);

/** Обязательный телефон. */
export const requiredRussianPhoneSchema = z
	.string()
	.min(1, "Укажите номер телефона")
	.refine(
		(val) => isValidRussianPhoneDisplay(normalizeRussianPhoneDisplay(val)),
		{ message: "Неверный формат телефона" },
	);
