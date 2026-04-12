"use client";

import { useState } from 'react';
import { HistoryChart } from '@/components/organisms/HistoryChart';
import { ProtectedPage } from '@/app/components/ProtectedPage';

type Range = '24h' | '1w' | '1m';

export default function HistoryPage() {
  const [range, setRange] = useState<Range>('24h');

  return (
    <ProtectedPage>
      <main className="bg-gradient-main min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-7xl animate-fade-in">
          <header className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-gradient tracking-tight">
                Sensor History
              </h1>
              <p className="text-sm opacity-50 mt-1">
                24h / 1w / 1m time-series data with CSV/JSON export
              </p>
            </div>
            <div className="flex gap-2">
              {(['24h', '1w', '1m'] as Range[]).map(r => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    range === r
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                      : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {r === '24h' ? '24 Hours' : r === '1w' ? '7 Days' : '30 Days'}
                </button>
              ))}
            </div>
          </header>

          <HistoryChart />
        </div>
      </main>
    </ProtectedPage>
  );
}
