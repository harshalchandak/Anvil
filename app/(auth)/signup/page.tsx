import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { SignupForm } from "./signup-form";

export default async function SignupPage() {
  const user = await getAuthUser();
  if (user) redirect("/dashboard");

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-medium tracking-tight">
          Start your content engine
        </h1>
        <p className="mt-1.5 text-sm text-neutral-500">
          Five minutes to your first growth run. No credit card.
        </p>
      </div>
      <SignupForm />
      <p className="text-center text-sm text-neutral-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-violet-700 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
