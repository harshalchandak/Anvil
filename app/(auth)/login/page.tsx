import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

type PageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const user = await getAuthUser();
  const { next } = await searchParams;
  if (user) redirect(next || "/dashboard");

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-medium tracking-tight">Welcome back</h1>
        <p className="mt-1.5 text-sm text-neutral-500">
          Log in to keep your content engine running.
        </p>
      </div>
      <LoginForm next={next ?? "/dashboard"} />
      <p className="text-center text-sm text-neutral-500">
        New to Netisize?{" "}
        <Link
          href="/signup"
          className="font-medium text-violet-700 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
