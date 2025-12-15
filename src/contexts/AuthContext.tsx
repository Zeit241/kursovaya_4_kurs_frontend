import React, { createContext, useContext, useEffect, useState } from "react";
import { authApi, usersApi } from "../api/client";
import { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, User } from "../api/types";
import axios from "axios";

interface AuthContextType {
	user: User | null;
	isLoading: boolean;
	login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
	register: (data: RegisterRequest) => Promise<{ success: boolean; error?: string }>;
	logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const storedUser = localStorage.getItem("user");
		if (storedUser) {
			setUser(JSON.parse(storedUser));
		}
		setIsLoading(false);
	}, []);

	const handleAuthResponse = async (response: LoginResponse | RegisterResponse) => {
		// Проверяем успешность по success или status
		const isSuccess = response.success === true || response.status === 200;
		
		if (isSuccess && response.data) {
			if (response.data.token) {
				localStorage.setItem("token", response.data.token);
			}
			if (response.data.user) {
				// Добавляем роль из ответа, если она есть
				const userWithRole: User = {
					...response.data.user,
					role: response.data.roleCode || response.data.user.role,
				};
				localStorage.setItem("user", JSON.stringify(userWithRole));
				setUser(userWithRole);
			} else if (response.data.patient?.user) {
				// Добавляем роль из ответа, если она есть
				const userWithRole: User = {
					...response.data.patient.user,
					role: response.data.roleCode || response.data.patient.user.role,
				};
				localStorage.setItem("user", JSON.stringify(userWithRole));
				setUser(userWithRole);
			} else if (response.data.email) {
				// Если есть только email, получаем полные данные пользователя
				try {
					const allUsers = await usersApi.getAll();
					const foundUser = allUsers.find(u => u.email === response.data.email);
					if (foundUser) {
						// Добавляем роль из ответа, если она есть
						const userWithRole: User = {
							...foundUser,
							role: response.data.roleCode || foundUser.role,
						};
						localStorage.setItem("user", JSON.stringify(userWithRole));
						setUser(userWithRole);
					} else {
						// Если пользователь не найден, создаем минимальный объект
						const minimalUser: User = {
							id: 0,
							email: response.data.email,
							phone: "",
							firstName: "",
							lastName: "",
							middleName: "",
							createdAt: new Date().toISOString(),
							updatedAt: new Date().toISOString(),
							active: true,
							role: response.data.roleCode,
						};
						localStorage.setItem("user", JSON.stringify(minimalUser));
						setUser(minimalUser);
					}
				} catch (error) {
					console.error("Ошибка при получении данных пользователя:", error);
					// В случае ошибки создаем минимальный объект
					const minimalUser: User = {
						id: 0,
						email: response.data.email,
						phone: "",
						firstName: "",
						lastName: "",
						middleName: "",
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
						active: true,
						role: response.data.roleCode,
					};
					localStorage.setItem("user", JSON.stringify(minimalUser));
					setUser(minimalUser);
				}
			}
		}
	};

	const login = async (email: string, password: string) => {
		try {
			const data = await authApi.login({ email, password });
			const isSuccess = data.success === true || data.status === 200;
			if (isSuccess) {
				await handleAuthResponse(data);
			}
			return { success: isSuccess };
		} catch (error) {
			if (axios.isAxiosError(error)) {
				const errorMessage = error.response?.data?.message || "Ошибка при входе в систему";
				return { success: false, error: errorMessage };
			}
			return { success: false, error: "Произошла неизвестная ошибка" };
		}
	};

	const register = async (data: RegisterRequest) => {
		try {
			const response = await authApi.register(data);
			const isSuccess = response.success === true || response.status === 200;
			if (isSuccess) {
				await handleAuthResponse(response);
			}
			return { success: isSuccess };
		} catch (error) {
			if (axios.isAxiosError(error)) {
				const errorMessage = error.response?.data?.message || "Ошибка при регистрации";
				return { success: false, error: errorMessage };
			}
			return { success: false, error: "Произошла неизвестная ошибка" };
		}
	};

	const logout = () => {
		authApi.logout();
		setUser(null);
	};

	return (
		<AuthContext.Provider
			value={{ user, isLoading, login, register, logout }}
		>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};
