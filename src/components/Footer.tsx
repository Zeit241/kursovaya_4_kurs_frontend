export default function Footer() {
	return (
		<footer className="border-t border-slate-200 bg-slate-50 py-6">
			<div className="container mx-auto px-4 text-center text-sm text-slate-500">
				<p className="text-center">
					&copy; {new Date().getFullYear()} Клиника Менеджмент. Все
					права защищены.
				</p>
			</div>
		</footer>
	);
}
