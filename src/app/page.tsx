import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import ConsistencyEngine from "@/components/ConsistencyEngine";
import JsonPreview from "@/components/JsonPreview";
import UseCases from "@/components/UseCases";
import CallToAction from "@/components/CallToAction";

export default function Home() {
  return (
    <main className="min-h-screen bg-cinelock-dark text-cream-white selection:bg-cinelock-accent/30 selection:text-cinelock-accent">
      <Navbar />
      <Hero />
      <HowItWorks />
      <ConsistencyEngine />
      <UseCases />
      <CallToAction />
    </main>
  );
}
