import Link from "next/link";
import { AuthForm } from "@/components/ui/auth-form";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="grid gap-4">
        <AuthForm mode="register" />
        <p className="text-center text-sm text-[#a8a29e]">
          Já tem conta? <Link href="/login">Entrar</Link>
        </p>
      </div>
    </main>
  );
}
