"use client";

import { X } from "lucide-react";
import { type ReactNode, useEffect } from "react";
import { Button } from "./button";

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	children: ReactNode;
	title?: string;
}

export function Modal({ isOpen, onClose, children, title }: ModalProps) {
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "unset";
		}

		return () => {
			document.body.style.overflow = "unset";
		};
	}, [isOpen]);

	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener("keydown", handleEscape);
		}

		return () => {
			document.removeEventListener("keydown", handleEscape);
		};
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity duration-200"
			onClick={onClose}
			onKeyDown={(e) => {
				if (e.key === "Escape") {
					onClose();
				}
			}}
			role="dialog"
			aria-modal="true"
		>
			<div
				className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-background rounded-2xl border-2 border-border shadow-2xl transition-all duration-200 transform scale-100"
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.stopPropagation()}
				role="document"
			>
				{/* Header */}
				{title && (
					<div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-border bg-background/95 backdrop-blur-sm">
						<h2 className="text-2xl font-bold text-foreground">{title}</h2>
						<Button
							variant="ghost"
							size="sm"
							onClick={onClose}
							className="rounded-full w-8 h-8 p-0"
							aria-label="閉じる"
						>
							<X className="w-5 h-5" />
						</Button>
					</div>
				)}

				{/* Content */}
				<div className="p-6">{children}</div>
			</div>
		</div>
	);
}
