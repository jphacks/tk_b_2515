/**
 * Logs error details to console for debugging
 */
export function logError(error: unknown, context?: string) {
	const message = context ? `Error in ${context}:` : "Error:";
	console.error(message, error);

	if (error instanceof Error) {
		console.error("Message:", error.message);
		console.error("Stack:", error.stack);
	}
}

/**
 * Gets error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	return String(error);
}
