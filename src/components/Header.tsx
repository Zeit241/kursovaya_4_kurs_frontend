import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatUserFullName } from "@/lib/formatUserFullName";
import { Menu, X } from "lucide-react";
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

type NavItem = { to: string; label: string };

function isNavActive(pathname: string, to: string): boolean {
	if (to === "/admin/dashboard" || to === "/patient/dashboard") {
		return (
			pathname === to ||
			pathname === to.replace("/dashboard", "") ||
			pathname === `${to}/`
		);
	}
	return pathname === to || pathname.startsWith(`${to}/`);
}

function navLinkClass(pathname: string, to: string): string {
	return cn("nav-item", isNavActive(pathname, to) && "nav-item-active");
}

const ADMIN_NAV: NavItem[] = [
	{ to: "/admin/dashboard", label: "Главная" },
	{ to: "/admin/doctors", label: "Врачи" },
	{ to: "/admin/patients", label: "Пациенты" },
	{ to: "/admin/categories", label: "Категории" },
	{ to: "/admin/services", label: "Услуги" },
	{ to: "/admin/appointments", label: "Приёмы" },
	{ to: "/admin/statistics", label: "Статистика" },
];

const PATIENT_NAV: NavItem[] = [
	{ to: "/patient/dashboard", label: "Главная" },
	{ to: "/patient/appointments", label: "Мои приёмы" },
	{ to: "/patient/book", label: "Запись на приём" },
	{ to: "/patient/profile", label: "Профиль" },
];

const DOCTOR_NAV: NavItem[] = [
	{ to: "/doctor/appointments", label: "Мои приёмы" },
];

function RoleNavLinks({
	items,
	pathname,
	onNavigate,
}: {
	items: NavItem[];
	pathname: string;
	onNavigate?: () => void;
}) {
	return (
		<>
			{items.map(({ to, label }) => (
				<Link
					key={to}
					to={to}
					className={navLinkClass(pathname, to)}
					onClick={onNavigate}
				>
					{label}
				</Link>
			))}
		</>
	);
}

export const Navigation: React.FC = () => {
	const { user, logout } = useAuth();
	const navigate = useNavigate();
	const { pathname } = useLocation();
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	const handleLogout = () => {
		logout();
		navigate("/auth/login");
	};

	const toggleMobileMenu = () => {
		setIsMobileMenuOpen(!isMobileMenuOpen);
	};

	const closeMobileMenu = () => setIsMobileMenuOpen(false);

	const roleNavItems =
		user?.role === "admin"
			? ADMIN_NAV
			: user?.role === "doctor"
				? DOCTOR_NAV
				: user
					? PATIENT_NAV
					: null;

	return (
		<header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md">
			<div className="container mx-auto flex h-16 items-center justify-between py-4 px-4">
				<h1 className="text-xl md:text-2xl font-bold text-foreground">
					Клиника Менеджмент
				</h1>

				<button
					className="md:hidden p-2"
					onClick={toggleMobileMenu}
					aria-label="Открыть меню"
				>
					{isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
				</button>

				<nav className="hidden md:flex items-center gap-3">
					{user ? (
						<>
							{roleNavItems && (
								<RoleNavLinks
									items={roleNavItems}
									pathname={pathname}
								/>
							)}
							<div className="flex items-center gap-3">
								{user.role === "doctor" && (
									<span className="hidden text-sm text-muted-foreground lg:inline">
										{formatUserFullName(user)}
									</span>
								)}
								<Button onClick={handleLogout}>Выйти</Button>
							</div>
						</>
					) : (
						<div className="flex items-center gap-2">
							<Link
								to="/auth/login"
								className={navLinkClass(pathname, "/auth/login")}
							>
								Вход
							</Link>
							<Link
								to="/auth/register"
								className={navLinkClass(pathname, "/auth/register")}
							>
								Регистрация
							</Link>
						</div>
					)}
				</nav>

				{isMobileMenuOpen && (
					<nav className="absolute top-16 left-0 right-0 bg-background border-b border-border p-4 md:hidden">
						<div className="flex flex-col gap-4">
							{user ? (
								<>
									{roleNavItems && (
										<RoleNavLinks
											items={roleNavItems}
											pathname={pathname}
											onNavigate={closeMobileMenu}
										/>
									)}
									<div className="flex flex-col gap-2">
										{user.role === "doctor" && (
											<p className="text-sm text-muted-foreground">
												{formatUserFullName(user)}
											</p>
										)}
										<Button onClick={handleLogout}>
											Выйти
										</Button>
									</div>
								</>
							) : (
								<div className="flex flex-col gap-2">
									<Link
										to="/auth/login"
										className={navLinkClass(pathname, "/auth/login")}
										onClick={closeMobileMenu}
									>
										Вход
									</Link>
									<Link
										to="/auth/register"
										className={navLinkClass(
											pathname,
											"/auth/register",
										)}
										onClick={closeMobileMenu}
									>
										Регистрация
									</Link>
								</div>
							)}
						</div>
					</nav>
				)}
			</div>
		</header>
	);
};
