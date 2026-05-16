import { requireAppUser } from "@/lib/auth";
import { OnboardingWizard } from "./wizard";

export default async function OnboardingPage() {
  await requireAppUser();
  return <OnboardingWizard />;
}
