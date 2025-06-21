import { render, screen } from '@testing-library/react';
import { ProgressTracker } from '@/components/ClientPortal/ProgressTracker';

const mockPhases = [
  {
    id: 1,
    name: 'Foundation & Audit Infrastructure',
    progress: 100,
    status: 'completed' as const,
    milestones: [
      { id: '1.1', name: 'Client Onboarding', completed: true },
      { id: '1.2', name: 'Authentication Setup', completed: true }
    ]
  },
  {
    id: 2,
    name: 'Open Coding & Analysis Platform',
    progress: 65,
    status: 'active' as const,
    milestones: [
      { id: '2.1', name: 'Open Coding Application', completed: true },
      { id: '2.2', name: 'Grading Rubric System', completed: false }
    ]
  },
  {
    id: 3,
    name: 'Failure Mode Analysis',
    progress: 0,
    status: 'pending' as const,
    milestones: []
  }
];

describe('ProgressTracker Component', () => {
  it('renders progress tracker with phases', () => {
    render(
      <ProgressTracker 
        currentPhase={2} 
        phases={mockPhases} 
      />
    );

    expect(screen.getByText('Project Progress')).toBeInTheDocument();
    expect(screen.getByText('Phase 2 of 3')).toBeInTheDocument();
    expect(screen.getByText('Overall Progress')).toBeInTheDocument();
  });

  it('displays correct overall progress calculation', () => {
    render(
      <ProgressTracker 
        currentPhase={2} 
        phases={mockPhases} 
      />
    );

    // Overall progress should be (100 + 65 + 0) / 3 = 55%
    expect(screen.getByText('55%')).toBeInTheDocument();
  });

  it('shows current phase milestones', () => {
    render(
      <ProgressTracker 
        currentPhase={2} 
        phases={mockPhases} 
      />
    );

    expect(screen.getByText('Current Phase Milestones')).toBeInTheDocument();
    expect(screen.getByText('Open Coding Application')).toBeInTheDocument();
    expect(screen.getByText('Grading Rubric System')).toBeInTheDocument();
  });

  it('renders phase status icons correctly', () => {
    render(
      <ProgressTracker 
        currentPhase={2} 
        phases={mockPhases} 
      />
    );

    const phaseItems = screen.getAllByText(/Phase \d:/);
    expect(phaseItems).toHaveLength(3);
  });

  it('handles empty milestones gracefully', () => {
    const phasesWithEmpty = [
      {
        id: 1,
        name: 'Test Phase',
        progress: 50,
        status: 'active' as const,
        milestones: []
      }
    ];

    render(
      <ProgressTracker 
        currentPhase={1} 
        phases={phasesWithEmpty} 
      />
    );

    expect(screen.getByText('Project Progress')).toBeInTheDocument();
    // Should not show milestones section when empty
    expect(screen.queryByText('Current Phase Milestones')).not.toBeInTheDocument();
  });
});