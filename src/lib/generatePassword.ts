/** Случайный пароль для учётной записи, созданной администратором. */
export function generateRandomPassword(length = 12): string {
	const lowercase = "abcdefghijklmnopqrstuvwxyz";
	const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	const numbers = "0123456789";
	const all = lowercase + uppercase + numbers;

	const array = new Uint32Array(length);
	window.crypto.getRandomValues(array);

	let password = "";
	password += lowercase[array[0] % lowercase.length];
	password += uppercase[array[1] % uppercase.length];
	password += numbers[array[2] % numbers.length];

	for (let i = 3; i < length; i++) {
		password += all[array[i] % all.length];
	}

	return password
		.split("")
		.sort(() => (array[0] % 2 === 0 ? 1 : -1) - 0.5)
		.join("");
}
