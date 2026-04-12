"use client";

import { AlertFeed } from '@/components/organisms/AlertFeed';
import { ProtectedPage } from '@/app/components/ProtectedPage';

export default function AlertsPage() {
  return (
    <ProtectedPage>
      <main className="bg-gradient-main min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-5xl animate-fade-in">
          <header className="mb-8">
            <h1 className="text-3xl font-black text-gradient tracking-tight">
              Alert Feed
            </h1>
            <p className="text-sm opacity-50 mt-1">
              Real-time alerts with acknowledge &amp; history
            </p>
          </header>

          <AlertFeed />
        </div>
      </main>
    </ProtectedPage>
  );
}
