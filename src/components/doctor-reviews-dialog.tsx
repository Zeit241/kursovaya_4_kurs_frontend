import { reviewsApi } from "@/api/client";
import { Review } from "@/api/types";
import { Button } from "@/components/ui/button";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Star, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";

interface DoctorReviewsDialogProps {
	doctorId: number;
	doctorName: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function DoctorReviewsDialog({
	doctorId,
	doctorName,
	open,
	onOpenChange,
}: DoctorReviewsDialogProps) {
	const [reviews, setReviews] = useState<Review[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	useEffect(() => {
		if (open && doctorId) {
			loadReviews();
		} else if (!open) {
			setReviews([]);
		}
	}, [open, doctorId]);

	const loadReviews = async () => {
		setIsLoading(true);
		try {
			const reviewsData = await reviewsApi.getByDoctor(doctorId);
			setReviews(reviewsData);
		} catch (error) {
			console.error("Error loading reviews:", error);
			toast.error("Ошибка", {
				description: "Не удалось загрузить отзывы",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleDeleteReview = async () => {
		if (!reviewToDelete) return;

		setIsDeleting(true);
		try {
			await reviewsApi.delete(reviewToDelete.id);
			toast.success("Отзыв удален", {
				description: "Отзыв успешно удален",
			});
			setReviewToDelete(null);
			await loadReviews();
		} catch (error) {
			console.error("Error deleting review:", error);
			toast.error("Ошибка", {
				description: "Не удалось удалить отзыв",
			});
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Отзывы о враче {doctorName}</DialogTitle>
					<DialogDescription>
						{reviews.length > 0
							? `Всего отзывов: ${reviews.length}`
							: "Пока нет отзывов"}
					</DialogDescription>
				</DialogHeader>

				{isLoading ? (
					<div className="flex justify-center py-8">
						<Loader2 className="h-8 w-8 animate-spin text-blue-600" />
					</div>
				) : reviews.length === 0 ? (
					<div className="text-center py-8 text-slate-500">
						Пока нет отзывов об этом враче
					</div>
				) : (
					<div className="space-y-4 mt-4">
						{reviews.map((review) => (
							<div
								key={review.id}
								className="border border-slate-200 rounded-lg p-4 space-y-2"
							>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<div className="flex items-center gap-1">
											{[1, 2, 3, 4, 5].map((star) => (
												<Star
													key={star}
													className={`h-4 w-4 ${
														star <= review.rating
															? "fill-yellow-400 text-yellow-400"
															: "text-slate-300"
													}`}
												/>
											))}
										</div>
										<span className="text-sm font-medium">
											{review.patientName || "Анонимный пациент"}
										</span>
									</div>
									<div className="flex items-center gap-2">
										<span className="text-xs text-slate-500">
											{format(
												new Date(review.createdAt),
												"dd MMMM yyyy",
												{ locale: ru }
											)}
										</span>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => setReviewToDelete(review)}
											className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</div>
								{review.reviewText && (
									<p className="text-sm text-slate-600 mt-2">
										{review.reviewText}
									</p>
								)}
							</div>
						))}
					</div>
				)}
			</DialogContent>

			<AlertDialog
				open={!!reviewToDelete}
				onOpenChange={(open) => !open && setReviewToDelete(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Подтверждение удаления</AlertDialogTitle>
						<AlertDialogDescription>
							Вы уверены, что хотите удалить этот отзыв? Это действие нельзя отменить.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>
							Отмена
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteReview}
							disabled={isDeleting}
							className="bg-red-500 hover:bg-red-600"
						>
							{isDeleting ? "Удаление..." : "Удалить"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Dialog>
	);
}

