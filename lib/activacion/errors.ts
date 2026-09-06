export class ActivacionError extends Error {
  code: string
  status: number
  details?: Record<string, unknown>

  constructor(
    code: string,
    message: string,
    status: number,
    details?: Record<string, unknown>
  ) {
    super(message)
    this.code = code
    this.status = status
    this.details = details
  }
}

export function errorResponse(error: unknown) {
  if (error instanceof ActivacionError) {
    return {
      status: error.status,
      body: {
        error: error.code,
        message: error.message,
        details: error.details,
      },
    }
  }

  console.error(error)
  return {
    status: 500,
    body: {
      error: 'INTERNAL_ERROR',
      message: 'Error interno del servidor',
    },
  }
}
