import Link from "next/link";
import { AuthForm } from "@/components/ui/auth-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="grid gap-4">
        <AuthForm mode="login" />
        <p className="text-center text-sm text-[#a8a29e]">
          Sem conta? <Link href="/register">Criar conta</Link>
        </p>
      </div>
    </main>
  );
}
