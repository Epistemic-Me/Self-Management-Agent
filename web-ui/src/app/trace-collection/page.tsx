'use client';

import { TraceCollectionHub } from '@/components/TraceCollection/TraceCollectionHub';
import { SidebarNav } from '@/components/SidebarNav';

export default function TraceCollectionPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarNav />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Trace Collection & Validation</h1>
            <p className="text-gray-600 mt-2">
              Upload and validate conversation trace files for analysis and evaluation
            </p>
          </div>
          
          <TraceCollectionHub />
        </div>
      </main>
    </div>
  );
}