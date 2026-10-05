const CODES = new Set([
  "EUR",
  "USD",
  "GBP",
  "JPY",
  "AUD",
  "CAD",
  "CHF",
  "NZD",
  "BTC",
  "ETH",
  "XAU",
  "XAG",
]);

export interface PrintContext {
  asset: string | null;
  timeframe: "M1" | "M5" | "M15" | null;
  regime: "OTC" | null;
  platform: string | null;
}

/** Lê par, tempo e plataforma só do texto que apareceu no print. */
export function parsePrintText(text: string): PrintContext {
  const upper = text.toUpperCase();
  const slashed = upper.match(/([A-Z]{3})\s*[/\-]\s*([A-Z]{3})/);
  let asset: string | null = null;
  if (slashed && CODES.has(slashed[1]) && CODES.has(slashed[2])) {
    asset = `${slashed[1]}/${slashed[2]}`;
  }
  if (!asset) {
    const compact = upper.replace(/[^A-Z]/g, "");
    for (let index = 0; index <= compact.length - 6; index += 1) {
      const base = compact.slice(index, index + 3);
      const quote = compact.slice(index + 3, index + 6);
      if (CODES.has(base) && CODES.has(quote)) {
        asset = `${base}/${quote}`;
        break;
      }
    }
  }

  const minute = upper.match(/(?:^|[^0-9])(1|5|15)\s*(?:M|MIN)\b/);
  const marked = upper.match(/\bM(1|5|15)\b/);
  const value = minute?.[1] ?? marked?.[1] ?? null;
  const timeframe = value === "1" ? "M1" : value === "5" ? "M5" : value === "15" ? "M15" : null;

  let platform: string | null = null;
  if (/QUOTEX/.test(upper)) platform = "Quotex";
  else if (/POCKET/.test(upper)) platform = "Pocket Option";
  else if (/IQ\s*OPTION|IQOPTION/.test(upper)) platform = "IQ Option";

  return {
    asset,
    timeframe,
    regime: /OTC/.test(upper) ? "OTC" : null,
    platform,
  };
}
