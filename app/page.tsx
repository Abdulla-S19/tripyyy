import { BackToTop } from "@/components/BackToTop";
import { CallToAction } from "@/components/landing/CallToAction";
import { Features } from "@/components/landing/Features";
import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { MoodPicker } from "@/components/landing/MoodPicker";
import { Navbar } from "@/components/landing/Navbar";
import { SamplePlan } from "@/components/landing/SamplePlan";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1 overflow-x-clip">
        <Hero />
        <HowItWorks />
        <SamplePlan />
        <MoodPicker />
        <Features />
        <CallToAction />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
