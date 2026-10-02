import type { Candle } from "@/domain/candles/types";
import type { Marking } from "@/domain/rules/types";

const MARKING_LABEL: Record<string, string> = {
  COMMAND: "Comando",
  SINGLE_RATE: "Taxa única",
  MAGIC_CANDLE: "Candle mágico",
  DEFENSE: "Defesa",
};

export function ChartOverlay({
  imageUrl,
  candles,
  markings,
  region,
  imageWidth,
  imageHeight,
}: {
  imageUrl: string;
  candles: Candle[];
  markings: Marking[];
  region: { left: number; top: number; right: number; bottom: number } | null;
  imageWidth: number;
  imageHeight: number;
}) {
  const prices = candles.flatMap((candle) => [candle.high, candle.low]);
  const max = prices.length ? Math.max(...prices) : 1;
  const min = prices.length ? Math.min(...prices) : 0;
  const span = max - min || 1;
  const drawable = markings.filter((marking) => marking.level != null);

  return (
    <div className="surface relative overflow-hidden bg-black">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt="Print do gráfico enviado para leitura" className="block h-auto w-full" />
      {region && imageWidth > 0 && imageHeight > 0 ? (
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${imageWidth} ${imageHeight}`}>
          {drawable.map((marking, index) => {
            const ratio = (max - (marking.level as number)) / span;
            const y = region.top + ratio * (region.bottom - region.top);
            return (
              <g key={`${marking.type}-${marking.candleIndex}-${index}`}>
                <line x1={region.left} x2={region.right} y1={y} y2={y} stroke="#e7e5e4" strokeWidth="1.5" />
                <text x={region.left + 8} y={y - 6} fill="#e7e5e4" fontSize="14">
                  {MARKING_LABEL[marking.type] ?? marking.type}
                </text>
              </g>
            );
          })}
        </svg>
      ) : null}
    </div>
  );
}
