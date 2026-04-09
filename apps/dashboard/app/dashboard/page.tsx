"use client";

import { LiveTelemetry } from '@/components/organisms/LiveTelemetry';
import { ControlPanel } from '@/components/organisms/ControlPanel';
import { AlertFeed } from '@/components/organisms/AlertFeed';
import { FishHealthPanel } from '@/components/organisms/FishHealthPanel';
import { ProtectedPage } from '@/app/components/ProtectedPage';

/**
 * Main Dashboard Page
 * Refactored into Atomic Design Organisms.
 * Conforms to the < 60 lines requirement.
 */
export default function DashboardPage() {
  return (
    <ProtectedPage>
      <main className="bg-gradient-main min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-7xl animate-fade-in">
          <header className="mb-8">
            <h1 className="text-4xl font-black text-gradient tracking-tight">
              Fishlinic Monitor
            </h1>
            <p className="text-sm opacity-50 mt-1">Autonomous Smart Aquarium Intelligence</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Live Data & AI */}
            <div className="lg:col-span-8 space-y-8">
              <LiveTelemetry />
              <FishHealthPanel />
            </div>

            {/* Right Column: Controls & Alerts */}
            <div className="lg:col-span-4 space-y-8">
              <ControlPanel />
              <AlertFeed />
            </div>
          </div>
        </div>
      </main>
    </ProtectedPage>
  );
}