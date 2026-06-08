import type { User } from "@/api/types";

/** ФИО в формате «Фамилия Имя Отчество». */
export function formatUserFullName(
	user: Pick<User, "lastName" | "firstName" | "middleName"> | null | undefined
): string {
	if (!user) return "";
	return [user.lastName, user.firstName, user.middleName].filter(Boolean).join(" ");
}
