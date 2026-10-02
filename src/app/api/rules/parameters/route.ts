import { NextResponse } from "next/server";
import { defaultRuleParameters, parameterStatus, RULE_VERSION } from "@/config/rule-parameters";
import { requireUser } from "@/lib/auth/session";
import { handle } from "@/lib/http";

export async function GET() {
  const requestId = crypto.randomUUID();
  return handle(requestId, async () => {
    await requireUser();
    return NextResponse.json({
      version: RULE_VERSION,
      parameters: defaultRuleParameters,
      status: parameterStatus(defaultRuleParameters),
    });
  });
}
