import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ClientPortalPage from '@/app/client-portal/page';

// Mock the API hooks
jest.mock('../../lib/api/client-portal', () => ({
  useProjectProgress: () => ({
    data: {
      currentPhase: 2,
      overallProgress: 55,
      phases: [
        {
          id: 1,
          name: 'Foundation & Audit Infrastructure',
          status: 'completed',
          progress: 100,
          milestones: []
        },
        {
          id: 2,
          name: 'Open Coding & Analysis Platform',
          status: 'active',
          progress: 65,
          milestones: []
        }
      ]
    },
    isLoading: false,
    mutate: jest.fn()
  }),
  useStakeholders: () => ({
    data: [
      {
        id: 'dev-1',
        name: 'Test Developer',
        email: 'dev@test.com',
        role: 'Developer',
        status: 'active',
        permissions: []
      }
    ],
    isLoading: false,
    mutate: jest.fn()
  }),
  usePhases: () => ({
    data: [],
    isLoading: false
  }),
  updateStakeholder: jest.fn(),
  inviteStakeholder: jest.fn(),
  logClientPortalActivity: jest.fn()
}));

describe('Client Portal Integration', () => {
  it('renders the complete client portal page', async () => {
    render(<ClientPortalPage />);

    expect(screen.getByText('Client Portal')).toBeInTheDocument();
    expect(screen.getByText('Track your project progress and coordinate with stakeholders')).toBeInTheDocument();
  });

  it('displays all navigation tabs', () => {
    render(<ClientPortalPage />);

    expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /progress/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /stakeholders/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /phases/i })).toBeInTheDocument();
  });

  it('switches between tabs correctly', async () => {
    render(<ClientPortalPage />);

    // Default is overview tab
    expect(screen.getByText('Active Milestones')).toBeInTheDocument();

    // Click progress tab
    fireEvent.click(screen.getByRole('tab', { name: /progress/i }));
    await waitFor(() => {
      expect(screen.getByText('Project Progress')).toBeInTheDocument();
    });

    // Click stakeholders tab
    fireEvent.click(screen.getByRole('tab', { name: /stakeholders/i }));
    await waitFor(() => {
      expect(screen.getByText('Project Stakeholders')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    // Mock loading state
    jest.doMock('@/lib/api/client-portal', () => ({
      useProjectProgress: () => ({ isLoading: true }),
      useStakeholders: () => ({ isLoading: true }),
      usePhases: () => ({ isLoading: true })
    }));

    render(<ClientPortalPage />);
    expect(screen.getByText('Loading client portal...')).toBeInTheDocument();
  });

  it('displays current phase badge', () => {
    render(<ClientPortalPage />);

    expect(screen.getByText('Phase 2 Active')).toBeInTheDocument();
  });

  it('handles stakeholder interactions', async () => {
    render(<ClientPortalPage />);

    // Go to stakeholders tab
    fireEvent.click(screen.getByRole('tab', { name: /stakeholders/i }));

    await waitFor(() => {
      expect(screen.getByText('Project Stakeholders')).toBeInTheDocument();
    });

    // Should show invite button for Developer role
    expect(screen.getByRole('button', { name: /invite/i })).toBeInTheDocument();
  });

  it('integrates with existing SDK Dashboard layout', () => {
    render(<ClientPortalPage />);

    // Should render within the main content area
    const mainContent = screen.getByText('Client Portal').closest('div');
    expect(mainContent).toHaveClass('flex-1');
  });
});