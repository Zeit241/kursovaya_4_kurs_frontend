import { Mail, Printer } from "lucide-react";
import { useEffect, useState } from "react";

import {
	CredentialsDisplay,
	type GeneratedCredentials,
} from "@/components/admin/CredentialsDisplay";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { printLoginCredentials } from "@/lib/printCredentials";
import { useSendLoginCredentialsEmailMutation } from "@/store/api/apiSlice";
import { toast } from "sonner";

export interface PostRegistrationActionsDialogProps {
	open: boolean;
	credentials: GeneratedCredentials;
	recipientName?: string;
	/** Текст для кнопки отправки, например «пациенту» или «врачу». */
	recipientLabel?: string;
	onBack: () => void;
}

export function PostRegistrationActionsDialog({
	open,
	credentials,
	recipientName,
	recipientLabel = "пациенту",
	onBack,
}: PostRegistrationActionsDialogProps) {
	const [sendEmail, { isLoading: isSendingEmail }] =
		useSendLoginCredentialsEmailMutation();
	const [emailSent, setEmailSent] = useState(false);

	useEffect(() => {
		if (open) setEmailSent(false);
	}, [open]);

	const handleSendEmail = async () => {
		try {
			await sendEmail({
				email: credentials.login,
				password: credentials.password,
				recipientName,
			}).unwrap();
			setEmailSent(true);
			toast.success("Письмо отправлено", {
				description: `Данные для входа отправлены на ${credentials.login}`,
			});
		} catch {
			toast.error("Не удалось отправить письмо", {
				description: "Проверьте настройки почты на сервере и попробуйте снова",
			});
		}
	};

	const handlePrint = () => {
		try {
			printLoginCredentials(credentials, recipientName);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Не удалось открыть печать";
			toast.error(message);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				if (!nextOpen) onBack();
			}}
		>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>Учётная запись создана</DialogTitle>
					<DialogDescription>
						Выберите действие с данными для входа
					</DialogDescription>
				</DialogHeader>

				<CredentialsDisplay credentials={credentials} />

				<div className="flex flex-col gap-2 pt-2">
					<Button
						type="button"
						onClick={handleSendEmail}
						disabled={isSendingEmail || emailSent}
						className="justify-start"
					>
						<Mail className="mr-2 h-4 w-4 shrink-0" />
						{emailSent
							? "Письмо отправлено"
							: `Отправить письмо на почту ${recipientLabel}`}
					</Button>
					<Button
						type="button"
						variant="outline"
						onClick={handlePrint}
						className="justify-start"
					>
						<Printer className="mr-2 h-4 w-4 shrink-0" />
						Распечатать данные для входа
					</Button>
					<Button type="button" variant="ghost" onClick={onBack}>
						Вернуться назад
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
