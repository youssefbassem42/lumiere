export class AppError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
    public readonly code = "APP_ERROR",
    public readonly details?: any
  ) {
    super(message);
  }
}

export function toErrorResponse(error: unknown) {
  if (error instanceof AppError) {
    return { 
      body: { 
        error: error.message, 
        code: error.code,
        details: error.details 
      }, 
      status: error.status 
    };
  }

  console.error(error);
  return { body: { error: "Internal server error" }, status: 500 };
}
