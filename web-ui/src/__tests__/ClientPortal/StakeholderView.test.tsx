import { render, screen, fireEvent } from '@testing-library/react';
import { StakeholderView } from '@/components/ClientPortal/StakeholderView';

const mockStakeholders = [
  {
    id: 'sme-1',
    name: 'Dr. Sarah Chen',
    email: 'sarah.chen@client.com',
    role: 'SME' as const,
    status: 'active' as const,
    lastActivity: '2 hours ago',
    permissions: ['evaluate-traces']
  },
  {
    id: 'dev-1',
    name: 'Mike Rodriguez',
    email: 'mike.rodriguez@client.com',
    role: 'Developer' as const,
    status: 'active' as const,
    lastActivity: '30 minutes ago',
    permissions: ['manage-project']
  },
  {
    id: 'analyst-1',
    name: 'Emma Thompson',
    email: 'emma.thompson@client.com',
    role: 'Analyst' as const,
    status: 'pending' as const,
    permissions: ['analyze-data']
  }
];

describe('StakeholderView Component', () => {
  it('renders stakeholder view with all stakeholders', () => {
    render(
      <StakeholderView 
        stakeholders={mockStakeholders}
        currentUserRole="Developer"
      />
    );

    expect(screen.getByText('Stakeholders')).toBeInTheDocument();
    // Active stakeholders should be visible by default
    expect(screen.getByText('Dr. Sarah Chen')).toBeInTheDocument();
    expect(screen.getByText('Mike Rodriguez')).toBeInTheDocument();
    
    // Pending stakeholder should be in the pending tab
    fireEvent.click(screen.getByRole('tab', { name: /pending/i }));
    expect(screen.getByText('Emma Thompson')).toBeInTheDocument();
  });

  it('shows invite button for Developer role', () => {
    render(
      <StakeholderView 
        stakeholders={mockStakeholders}
        currentUserRole="Developer"
      />
    );

    expect(screen.getByRole('button', { name: /invite/i })).toBeInTheDocument();
  });

  it('hides invite button for non-Developer roles', () => {
    render(
      <StakeholderView 
        stakeholders={mockStakeholders}
        currentUserRole="SME"
      />
    );

    expect(screen.queryByRole('button', { name: /invite/i })).not.toBeInTheDocument();
  });

  it('displays correct stakeholder counts in tabs', () => {
    render(
      <StakeholderView 
        stakeholders={mockStakeholders}
        currentUserRole="Developer"
      />
    );

    // Active: 2, Pending: 1, Inactive: 0
    expect(screen.getByText('2')).toBeInTheDocument(); // Active count
    expect(screen.getByText('1')).toBeInTheDocument(); // Pending count
  });

  it('calls onInviteStakeholder when invite button is clicked', () => {
    const mockInvite = jest.fn();
    
    render(
      <StakeholderView 
        stakeholders={mockStakeholders}
        currentUserRole="Developer"
        onInviteStakeholder={mockInvite}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /invite/i }));
    expect(mockInvite).toHaveBeenCalledTimes(1);
  });

  it('shows approve button for pending stakeholders when user is Developer', () => {
    render(
      <StakeholderView 
        stakeholders={mockStakeholders}
        currentUserRole="Developer"
      />
    );

    // Click on pending tab
    fireEvent.click(screen.getByRole('tab', { name: /pending/i }));
    
    expect(screen.getByRole('button', { name: /approve/i })).toBeInTheDocument();
  });

  it('displays role descriptions correctly', () => {
    render(
      <StakeholderView 
        stakeholders={mockStakeholders}
        currentUserRole="Developer"
      />
    );

    expect(screen.getByText(/Technical implementation and system integration/)).toBeInTheDocument();
  });

  it('shows current user role information', () => {
    render(
      <StakeholderView 
        stakeholders={mockStakeholders}
        currentUserRole="Developer"
      />
    );

    expect(screen.getByText('Your Role: Developer')).toBeInTheDocument();
    expect(screen.getByText(/As a Developer, you can invite and manage/)).toBeInTheDocument();
  });
});