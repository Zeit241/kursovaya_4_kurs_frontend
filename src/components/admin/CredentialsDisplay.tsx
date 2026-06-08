import { Label } from "@/components/ui/label";

export interface GeneratedCredentials {
	login: string;
	password: string;
}

export function CredentialsDisplay({
	credentials,
}: {
	credentials: GeneratedCredentials;
}) {
	return (
		<div className="space-y-6">
			<div className="text-center mb-6">
				<h3 className="text-xl font-semibold mb-2">
					Данные для входа в систему
				</h3>
				<p className="text-muted-foreground">
					Сохраните эти данные, они понадобятся для входа в систему
				</p>
			</div>
			<div className="space-y-4 p-6 border rounded-lg bg-muted/40">
				<div>
					<Label className="text-sm font-medium">Логин (Email):</Label>
					<div className="mt-1 p-3 bg-background border rounded-md">
						{credentials.login}
					</div>
				</div>
				<div>
					<Label className="text-sm font-medium">Пароль:</Label>
					<div className="mt-1 p-3 bg-background border rounded-md font-mono">
						{credentials.password}
					</div>
				</div>
			</div>
		</div>
	);
}
