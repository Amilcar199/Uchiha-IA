export function supabaseAuthMessage(technical: string, fallback: string): string {
  const text = technical.toLowerCase();
  if (text.includes("signups are disabled") || text.includes("logins are disabled") || text.includes("provider")) {
    return "O acesso por e-mail está desligado no Supabase. Em Authentication → Sign In / Providers, ative Email.";
  }
  if (text.includes("not confirmed") || text.includes("email_not_confirmed")) {
    return "A conta existe, mas o e-mail ainda não foi confirmado. Abra a mensagem ou desative a confirmação no Supabase.";
  }
  if (text.includes("already registered") || text.includes("already been registered")) {
    return "Já existe uma conta com este e-mail.";
  }
  return fallback;
}
