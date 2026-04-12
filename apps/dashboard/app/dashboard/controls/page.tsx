"use client";

import { ControlPanel } from '@/components/organisms/ControlPanel';
import { ProtectedPage } from '@/app/components/ProtectedPage';
import { useSocket } from '@/hooks/useSocket';

export default function ControlsPage() {
  const { connected } = useSocket();

  return (
    <ProtectedPage>
      <main className="bg-gradient-main min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-5xl animate-fade-in">
          <header className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-gradient tracking-tight">
                Manual Controls
              </h1>
              <p className="text-sm opacity-50 mt-1">
                Feed, pump &amp; LED relay control
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-red-400'}`} />
              <span className={`text-xs font-semibold ${connected ? 'text-emerald-400' : 'text-red-400'}`}>
                {connected ? 'Connected' : 'Offline'}
              </span>
            </div>
          </header>

          <ControlPanel />
        </div>
      </main>
    </ProtectedPage>
  );
}
