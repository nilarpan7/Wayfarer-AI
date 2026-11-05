import { HeroSection } from "@/components/landing/hero-section";
import { DestinationStrip } from "@/components/landing/destination-strip";
import { DestinationShowcase3D } from "@/components/landing/destination-showcase-3d";
import { HowItWorks } from "@/components/landing/how-it-works";
import { LifecycleSection } from "@/components/landing/lifecycle-section";
import { Differentiators } from "@/components/landing/differentiators";
import { FeaturesGrid } from "@/components/landing/features-grid";
import { TrustBar } from "@/components/landing/trust-bar";
import { PricingSection } from "@/components/landing/pricing-section";

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <DestinationStrip />
      <DestinationShowcase3D />
      <HowItWorks />
      <LifecycleSection />
      <Differentiators />
      <FeaturesGrid />
      <TrustBar />
      <PricingSection />
    </>
  );
}
