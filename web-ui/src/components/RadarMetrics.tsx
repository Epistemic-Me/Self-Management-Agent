'use client';

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

interface RadarMetricsProps {
  metrics: {
    userIdentification?: number;
    beliefEvidencing?: number;
    beliefVerification?: number;
    learningProgress?: number;
    questionClarity?: number;
    answerPrediction?: number;
    ambiguity?: number;
  };
}

export function RadarMetrics({ metrics }: RadarMetricsProps) {
  const data = [
    { subject: 'User ID', value: (metrics.userIdentification || 0) * 100, fullMark: 100 },
    { subject: 'Belief Evidence', value: (metrics.beliefEvidencing || 0) * 100, fullMark: 100 },
    { subject: 'Belief Verify', value: (metrics.beliefVerification || 0) * 100, fullMark: 100 },
    { subject: 'Learning', value: (metrics.learningProgress || 0) * 100, fullMark: 100 },
    { subject: 'Question Clarity', value: (metrics.questionClarity || 0) * 100, fullMark: 100 },
    { subject: 'Answer Predict', value: (metrics.answerPrediction || 0) * 100, fullMark: 100 },
    { subject: 'Ambiguity', value: (metrics.ambiguity || 0) * 100, fullMark: 100 },
  ];

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 100]} 
            tick={{ fontSize: 8 }}
            tickCount={6}
          />
          <Radar
            name="Metrics"
            dataKey="value"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.2}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
} 