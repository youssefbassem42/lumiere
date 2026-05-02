export class AppError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
    public readonly code = "APP_ERROR"
  ) {
    super(message);
  }
}

export function toErrorResponse(error: unknown) {
  if (error instanceof AppError) {
    return { body: { error: error.message, code: error.code }, status: error.status };
  }

  console.error(error);
  return { body: { error: "Internal server error" }, status: 500 };
}
