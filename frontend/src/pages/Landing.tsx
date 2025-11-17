import { Hero } from '../components/landing/Hero';
import { UseCases } from '../components/landing/UseCases';
import { Features } from '../components/landing/Features';
import { CTA } from '../components/landing/CTA';

export function Landing() {
  return (
    <div className="min-h-screen bg-midnight-graphite">
      <Hero />
      <UseCases />
      <Features />
      <CTA />
    </div>
  );
}

