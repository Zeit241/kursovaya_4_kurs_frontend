import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface QueueEntry {
	patientId: number;
	position: number;
	patientFullName?: string | null;
}

interface DoctorLiveQueueCardProps {
	queueLoading: boolean;
	liveQueue: QueueEntry[];
}

export function DoctorLiveQueueCard({
	queueLoading,
	liveQueue,
}: DoctorLiveQueueCardProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Живая очередь</CardTitle>
				<CardDescription>
					Порядок обновляется после завершения приёма
				</CardDescription>
			</CardHeader>
			<CardContent>
				{queueLoading ? (
					<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
				) : liveQueue.length === 0 ? (
					<p className="text-sm text-muted-foreground">Очередь пуста</p>
				) : (
					<ol className="list-decimal space-y-2 pl-4 text-sm">
						{liveQueue
							.slice()
							.sort((x, y) => x.position - y.position)
							.map((entry) => (
								<li key={`${entry.patientId}-${entry.position}`}>
									{entry.patientFullName?.trim() ||
										`Пациент #${entry.patientId}`}
									<span className="text-muted-foreground">
										{" "}
										(поз. {entry.position + 1})
									</span>
								</li>
							))}
					</ol>
				)}
			</CardContent>
		</Card>
	);
}
