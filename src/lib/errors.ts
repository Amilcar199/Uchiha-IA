export class AppError extends Error {
  readonly code: string;
  readonly userMessage: string;
  readonly status: number;
  readonly technicalDetails?: string;

  constructor(code: string, userMessage: string, status = 400, technicalDetails?: string) {
    super(userMessage);
    this.name = "AppError";
    this.code = code;
    this.userMessage = userMessage;
    this.status = status;
    this.technicalDetails = technicalDetails;
  }
}

export function toErrorPayload(error: unknown, requestId?: string) {
  if (error instanceof AppError) {
    return {
      status: error.status,
      body: {
        error: {
          code: error.code,
          message: error.userMessage,
          requestId: requestId ?? null,
        },
      },
      technical: error.technicalDetails ?? error.message,
    };
  }

  const message = error instanceof Error ? error.message : "Erro desconhecido";
  return {
    status: 500,
    body: {
      error: {
        code: "INTERNAL_001",
        message: "Não foi possível concluir a análise. Tente novamente.",
        requestId: requestId ?? null,
      },
    },
    technical: message,
  };
}
