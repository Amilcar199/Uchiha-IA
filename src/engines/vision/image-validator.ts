export interface ImageValidation {
  accepted: boolean;
  width: number;
  height: number;
  blockers: string[];
  warnings: string[];
  code: string | null;
  userMessage: string | null;
}

const MIN_WIDTH = 480;
const MIN_HEIGHT = 320;

export function validateImageSize(width: number, height: number): ImageValidation {
  if (width < MIN_WIDTH || height < MIN_HEIGHT) {
    return {
      accepted: false,
      width,
      height,
      blockers: ["LOW_RESOLUTION"],
      warnings: [],
      code: "VISION_002",
      userMessage:
        "A imagem está pequena demais para uma leitura confiável. Envie um print maior, com a área do gráfico nítida.",
    };
  }

  return {
    accepted: true,
    width,
    height,
    blockers: [],
    warnings: [],
    code: null,
    userMessage: null,
  };
}
