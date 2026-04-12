"use client";

import { FishHealthPanel } from '@/components/organisms/FishHealthPanel';
import { HistoryChart } from '@/components/organisms/HistoryChart';
import { ProtectedPage } from '@/app/components/ProtectedPage';

export default function FishHealthPage() {
  return (
    <ProtectedPage>
      <main className="bg-gradient-main min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-7xl animate-fade-in">
          <header className="mb-8">
            <h1 className="text-3xl font-black text-gradient tracking-tight">
              Fish Health
            </h1>
            <p className="text-sm opacity-50 mt-1">
              YOLO disease detection, behavior anomaly analysis &amp; health scoring
            </p>
          </header>

          <div className="space-y-8">
            <FishHealthPanel />
            <HistoryChart />
          </div>
        </div>
      </main>
    </ProtectedPage>
  );
}
