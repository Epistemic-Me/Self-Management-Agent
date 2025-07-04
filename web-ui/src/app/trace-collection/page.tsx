'use client';

import { TraceCollectionHub } from '@/components/TraceCollection/TraceCollectionHub';

export default function TraceCollectionPage() {
  return (
    <main className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Trace Collection & Validation</h1>
          <p className="text-slate-300 mt-2">
            Upload and validate conversation trace files for analysis and evaluation
          </p>
        </div>
        
        <TraceCollectionHub />
      </div>
    </main>
  );
}