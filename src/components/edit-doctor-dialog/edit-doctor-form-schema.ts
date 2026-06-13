import * as z from "zod";

import { optionalRussianPhoneSchema } from "@/lib/normalizeRussianPhone";

export const editDoctorFormSchema = z.object({
	lastName: z.string().min(2, "Фамилия должна содержать минимум 2 символа"),
	firstName: z.string().min(2, "Имя должно содержать минимум 2 символа"),
	middleName: z.string().optional(),
	phone: optionalRussianPhoneSchema,
	email: z.string().email("Неверный формат email").min(1, "Email обязателен"),
	experienceYears: z
		.string()
		.optional()
		.refine((val) => {
			if (!val) return true;
			const num = parseInt(val);
			return !isNaN(num) && num >= 0 && num <= 80;
		}, "Стаж должен быть от 0 до 80 лет"),
	bio: z.string().optional(),
	specializationIds: z.array(z.number()).optional(),
	photo: z.string().optional(),
});

export type EditDoctorFormValues = z.infer<typeof editDoctorFormSchema>;
