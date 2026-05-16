import { getAuthUser } from "@/lib/auth";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { LogoStrip } from "@/components/landing/LogoStrip";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { AgentsShowcase } from "@/components/landing/AgentsShowcase";
import { BentoGrid } from "@/components/landing/BentoGrid";
import { Testimonials } from "@/components/landing/Testimonials";
import { Pricing } from "@/components/landing/Pricing";
import { Faq } from "@/components/landing/Faq";
import { Footer } from "@/components/landing/Footer";

export default async function HomePage() {
  const user = await getAuthUser();
  return (
    <>
      <Navbar signedIn={Boolean(user)} />
      <main>
        <Hero />
        <LogoStrip />
        <HowItWorks />
        <AgentsShowcase />
        <BentoGrid />
        <Testimonials />
        <Pricing />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
