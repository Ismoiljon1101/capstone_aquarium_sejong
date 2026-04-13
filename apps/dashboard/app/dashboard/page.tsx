"use client";

import { LiveTelemetry } from '@/components/organisms/LiveTelemetry';
import { ControlPanel } from '@/components/organisms/ControlPanel';
import { AlertFeed } from '@/components/organisms/AlertFeed';
import { FishHealthPanel } from '@/components/organisms/FishHealthPanel';
import { VeronicaChat } from '@/components/organisms/VeronicaChat';
import { ProtectedPage } from '@/app/components/ProtectedPage';

export default function DashboardPage() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <ProtectedPage>
      <main className="bg-gradient-main min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-7xl animate-fade-in">

          {/* Premium header */}
          <header className="mb-8 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm text-slate-500 font-medium mb-1">{greeting}</p>
              <h1 className="text-4xl font-black text-gradient tracking-tight leading-tight">
                Fishlinic Monitor
              </h1>
              <p className="text-sm text-slate-500 mt-1.5">Autonomous Smart Aquarium Intelligence</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900/80 border border-white/[0.07]">
                <span className="text-lg">🐟</span>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold tracking-widest">TANK STATUS</p>
                  <p className="text-xs font-bold text-emerald-400">Operational</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900/80 border border-white/[0.07]">
                <span className="text-lg">🤖</span>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold tracking-widest">AI MODEL</p>
                  <p className="text-xs font-bold text-cyan-400">YOLO v11</p>
                </div>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: sensor + fish AI */}
            <div className="lg:col-span-8 space-y-6">
              <LiveTelemetry />
              <FishHealthPanel />
              <VeronicaChat />
            </div>

            {/* Right: controls + alerts */}
            <div className="lg:col-span-4 space-y-6">
              <ControlPanel />
              <AlertFeed />
            </div>
          </div>
        </div>
      </main>
    </ProtectedPage>
  );
}
