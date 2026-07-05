import { useEffect, useState } from "react";
import { Navbar } from "../components/landing/Navbar";
import { HeroSection } from "../components/landing/HeroSection";
import { WhySection } from "../components/landing/WhySection";
import { WorkflowSection } from "../components/landing/WorkflowSection";
import { ArchitectureSection } from "../components/landing/ArchitectureSection";
import { CTASection } from "../components/landing/CTASection";
import { Footer } from "../components/landing/Footer";

interface LandingPageProps {
  theme: string;
  setTheme: (theme: string) => void;
}

const navSections = [
  { id: "hero", label: "Hero" },
  { id: "why", label: "Why AURA" },
  { id: "workflow", label: "Workflow" },
  { id: "architecture", label: "Architecture" },
  { id: "cta", label: "Get Started" },
];


const heroStats = [
  { value: "45 min", label: "Manual review" },
  { value: "<30 sec", label: "Agent evaluation" },
  { value: "18", label: "Collections" },
];

export default function LandingPage({ theme, setTheme }: LandingPageProps) {
  const [activeSection, setActiveSection] = useState("hero");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target instanceof HTMLElement) {
          setActiveSection(visible.target.id);
        }
      },
      { threshold: [0.2, 0.35, 0.55], rootMargin: "-10% 0px -55% 0px" }
    );

    navSections.forEach(({ id }) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-bg-base text-text-primary flex flex-col font-sans scroll-smooth overflow-x-hidden">
      <Navbar theme={theme} setTheme={setTheme} activeSection={activeSection} sections={navSections} />
      <main className="relative">
        <HeroSection id="hero" heroStats={heroStats} />
        <WhySection id="why" />
        <WorkflowSection id="workflow" />
        <ArchitectureSection id="architecture" />
        <CTASection id="cta" />
      </main>
      <Footer />
    </div>
  );
}