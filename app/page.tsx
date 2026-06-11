import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import ShowcaseSection from "@/components/landing/ShowcaseSection";
import CTASection from "@/components/landing/CTASection";

export default function LandingPage() {
  return (
    <div className="overflow-hidden">
      <HeroSection />
      <FeaturesSection />
      <ShowcaseSection />
      <CTASection />
    </div>
  );
}
