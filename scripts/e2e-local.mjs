import { renderChart } from "../src/tests/helpers/render-chart.ts";

const base = "http://localhost:3000";
const email = `e2e-${Date.now()}@example.com`;

const register = await fetch(`${base}/api/auth/register`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Leitor", email, password: "senha-segura-1" }),
});
const registerBody = await register.json();
if (!register.ok) {
  console.error("register failed", register.status, registerBody);
  process.exit(1);
}

const cookie = register.headers.getSetCookie?.().map((item) => item.split(";")[0]).join("; ");
if (!cookie) {
  console.error("missing session cookie");
  process.exit(1);
}

const candles = Array.from({ length: 16 }, (_, index) => {
  const open = 10 + (index % 4) * 0.3;
  const close = open + (index % 2 === 0 ? 0.9 : -0.6);
  return {
    open,
    close,
    high: Math.max(open, close) + 0.4,
    low: Math.min(open, close) - 0.3,
  };
});

const image = await renderChart({ candles, theme: "dark", sidebar: true });
const form = new FormData();
form.set("image", new Blob([image], { type: "image/png" }), "chart.png");
form.set("asset", "EUR/USD");
form.set("marketRegime", "REAL");
form.set("timeframe", "M1");
form.set("platform", "quotex");
form.set("secondsElapsed", "8");
form.set("newsDeclaration", "FREE");

const created = await fetch(`${base}/api/analyses`, {
  method: "POST",
  headers: { cookie },
  body: form,
});
const createdBody = await created.json();
if (!created.ok) {
  console.error("analysis failed", created.status, createdBody);
  process.exit(1);
}

const detail = await fetch(`${base}/api/analyses/${createdBody.id}`, { headers: { cookie } });
const detailBody = await detail.json();
const analysis = detailBody.analysis;
console.log(
  JSON.stringify(
    {
      status: created.status,
      id: createdBody.id,
      decision: analysis.decision,
      confidence: analysis.confidence,
      cycle: analysis.cycle,
      candles: analysis.result.vision.candles.length,
      explanation: analysis.result.explanation.slice(0, 4),
    },
    null,
    2,
  ),
);
