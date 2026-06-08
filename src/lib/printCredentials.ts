import type { GeneratedCredentials } from "@/components/admin/CredentialsDisplay";

export function printLoginCredentials(
	credentials: GeneratedCredentials,
	recipientName?: string,
) {
	const title = recipientName
		? `Данные для входа — ${recipientName}`
		: "Данные для входа в систему";

	const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; color: #111; }
    h1 { font-size: 1.25rem; margin-bottom: 1.5rem; }
    .field { margin-bottom: 1rem; }
    .label { font-size: 0.875rem; color: #555; margin-bottom: 0.25rem; }
    .value { font-size: 1rem; padding: 0.5rem 0.75rem; border: 1px solid #ccc; border-radius: 4px; }
    .mono { font-family: ui-monospace, monospace; }
    .hint { margin-top: 2rem; font-size: 0.875rem; color: #666; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div class="field">
    <div class="label">Логин (email)</div>
    <div class="value">${escapeHtml(credentials.login)}</div>
  </div>
  <div class="field">
    <div class="label">Пароль</div>
    <div class="value mono">${escapeHtml(credentials.password)}</div>
  </div>
  <p class="hint">Сохраните эти данные. Пароль рекомендуется сменить после первого входа.</p>
</body>
</html>`;

	const printWindow = window.open("", "_blank", "noopener,noreferrer,width=640,height=480");
	if (!printWindow) {
		throw new Error("Не удалось открыть окно печати. Разрешите всплывающие окна.");
	}
	printWindow.document.write(html);
	printWindow.document.close();
	printWindow.focus();
	printWindow.print();
}

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}
