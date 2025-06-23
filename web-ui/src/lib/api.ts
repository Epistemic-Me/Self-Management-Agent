// API client for Self-Management Agent services

export interface Conversation {
  id: string;
  user_id: string;
  started_at: string;
  closed: boolean;
  meta?: any;
  last_turn?: string;
  turn_count?: number;
  status?: 'Reviewed' | 'Edited' | 'New' | 'Simulating';
}

export interface Turn {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  extra_json?: any;
  created_at: string;
}

export interface ConversationDetail {
  id: string;
  user_id: string;
  started_at: string;
  closed: boolean;
  meta?: any;
  turns: Turn[];
  metrics?: {
    userIdentification?: number;
    beliefEvidencing?: number;
    beliefVerification?: number;
    learningProgress?: number;
    questionClarity?: number;
    answerPrediction?: number;
    ambiguity?: number;
  };
  belief_map?: {
    core: Belief[];
    related: Belief[];
  };
}

export interface Belief {
  id: string;
  statement: string;
  confidence: number;
  context_uuid?: string;
}

// Updated user interface to match profile-mcp database structure
export interface ProfileUser {
  user_id: string;
  dontdie_uid: string;
  created_at: string;
  checklist_progress?: ChecklistItem[];
  self_model?: SelfModel;
  belief_systems?: BeliefSystem[];
}

export interface ChecklistItem {
  bucket_code: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  updated_at: string;
  data_ref?: any;
  source?: string;
}

export interface SelfModel {
  id: string;
  user_id: string;
  created_at: string;
  // Add more fields as needed based on actual self-model structure
}

export interface BeliefSystem {
  id: string;
  name: string;
  beliefs: Belief[];
}

// Keep legacy SimulatedUser interface for backwards compatibility
export interface SimulatedUser {
  id: string;
  demographics: {
    age: number;
    gender: string;
    location: string;
    occupation: string;
  };
  tags: string[];
  philosophies: Philosophy[];
}

export interface Philosophy {
  name: string;
  root_count: number;
  sub_count: number;
  belief_system_id: string;
}

export interface ProgressTrend {
  weight?: Array<{ date: string; value: number }>;
  dd_score?: Array<{ date: string; value: number }>;
}

const API_BASE = process.env.NEXT_PUBLIC_MCP_BASE || 'http://localhost:8010';
const EM_MCP_BASE = process.env.NEXT_PUBLIC_EM_MCP || 'http://localhost:8120';
const TOKEN = process.env.NEXT_PUBLIC_TOKEN || 'TEST_TOKEN';

const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
};

// Profile MCP API calls
export async function listUsers(): Promise<ProfileUser[]> {
  const response = await fetch(`${API_BASE}/listUsers`, {
    headers,
  });
  if (!response.ok) throw new Error('Failed to fetch users');
  const data = await response.json();
  return data.data || [];
}

export async function getUser(userId: string): Promise<ProfileUser> {
  const response = await fetch(`${API_BASE}/getUser?user_id=${userId}`, {
    headers,
  });
  if (!response.ok) throw new Error('Failed to fetch user');
  const data = await response.json();
  return data.data;
}

export async function getUserChecklistProgress(userId: string): Promise<ChecklistItem[]> {
  // We need to authenticate as this user to get their checklist
  // For now, we'll use the TEST_TOKEN but in a real scenario we'd need proper user tokens
  const userHeaders = {
    'Authorization': `Bearer TEST_TOKEN`,
    'Content-Type': 'application/json',
  };
  
  console.log(`🔍 Fetching checklist progress for user: ${userId}`);
  console.log(`📡 API_BASE: ${API_BASE}`);
  
  const response = await fetch(`${API_BASE}/getChecklistProgress`, {
    headers: userHeaders,
  });
  
  console.log(`📊 Checklist API response status: ${response.status}`);
  
  if (!response.ok) {
    console.error(`❌ Failed to fetch checklist progress: ${response.status} ${response.statusText}`);
    throw new Error('Failed to fetch checklist progress');
  }
  
  const data = await response.json();
  console.log(`✅ Checklist progress data:`, data);
  
  // Calculate completion percentage for logging
  const completedCount = data.filter((item: ChecklistItem) => item.status === 'completed').length;
  const completionPercentage = Math.round((completedCount / data.length) * 100);
  console.log(`📈 Completion: ${completedCount}/${data.length} = ${completionPercentage}%`);
  
  return data;
}

export async function getUserSelfModel(userId: string): Promise<SelfModel | null> {
  try {
    const response = await fetch(`${API_BASE}/getSelfModel?user_id=${userId}`, {
      headers,
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.data;
  } catch (error) {
    return null;
  }
}

export async function getUserBeliefSystems(userId: string): Promise<BeliefSystem[]> {
  try {
    // This would need to be implemented in profile-mcp
    // For now return empty array
    return [];
  } catch (error) {
    return [];
  }
}

export async function listConversations(limit = 100): Promise<Conversation[]> {
  const response = await fetch(`${API_BASE}/listConversations?limit=${limit}`, {
    headers,
  });
  if (!response.ok) throw new Error('Failed to fetch conversations');
  const data = await response.json();
  
  // Map API response format to UI format
  const conversations = (data.data || []).map((conv: any) => ({
    id: conv.conversation_id,
    user_id: conv.user_id,
    started_at: conv.started_at,
    closed: conv.closed,
    meta: conv.meta,
    // Derive additional fields
    last_turn: conv.meta?.sim ? 'Simulated conversation' : 'New conversation',
    turn_count: 0, // Will be populated when we fetch conversation details
    status: conv.meta?.sim ? 'Simulating' : (conv.closed ? 'Reviewed' : 'New')
  }));
  
  return conversations;
}

export async function getConversation(id: string): Promise<ConversationDetail> {
  const response = await fetch(`${API_BASE}/getConversation?conversation_id=${id}`, {
    headers,
  });
  if (!response.ok) throw new Error('Failed to fetch conversation');
  const data = await response.json();
  return data.data;
}

export async function startConversation(userId?: string): Promise<{ conversation_id: string }> {
  // Use provided userId or default to the first available user
  const defaultUserId = userId || '145de7d1-37be-48ba-9b3b-dc662d8c2263';
  
  const response = await fetch(`${API_BASE}/startConversation`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      user_id: defaultUserId,
      meta: { 
        source: 'web-ui-chat',
        template: 'general'
      }
    }),
  });
  if (!response.ok) throw new Error('Failed to start conversation');
  const data = await response.json();
  return data.data;
}

export async function appendTurn(
  conversation_id: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  close_conversation = false
): Promise<void> {
  const response = await fetch(`${API_BASE}/appendTurn`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      conversation_id,
      role,
      content,
      close_conversation,
    }),
  });
  if (!response.ok) throw new Error('Failed to append turn');
}

export async function getProgressTrend(user_id: string): Promise<ProgressTrend> {
  const response = await fetch(`${API_BASE}/getProgressTrend?user_id=${user_id}`, {
    headers,
  });
  if (!response.ok) throw new Error('Failed to fetch progress trend');
  const data = await response.json();
  return data.data;
}

// Legacy API calls for backwards compatibility
export async function listSimulatedUsers(): Promise<SimulatedUser[]> {
  // Temporary mock data with proper UUIDs
  return [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      demographics: {
        age: 35,
        gender: 'Male',
        location: 'San Francisco',
        occupation: 'Software Developer',
      },
      tags: ['Bio-Hackers', 'Tech-Enthusiasts', 'Quantified-Self'],
      philosophies: [
        {
          name: 'Health General',
          root_count: 2,
          sub_count: 4,
          belief_system_id: 'bs-1',
        },
        {
          name: 'Sleep Optimization',
          root_count: 1,
          sub_count: 3,
          belief_system_id: 'bs-2',
        },
      ],
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      demographics: {
        age: 28,
        gender: 'Female',
        location: 'New York',
        occupation: 'Data Scientist',
      },
      tags: ['Parents', 'Time-Starved'],
      philosophies: [
        {
          name: 'Health General',
          root_count: 1,
          sub_count: 2,
          belief_system_id: 'bs-3',
        },
      ],
    },
  ];
}

export async function getSimulatedUser(id: string): Promise<SimulatedUser> {
  const users = await listSimulatedUsers();
  const user = users.find(u => u.id === id);
  if (!user) throw new Error('User not found');
  return user;
}

export async function getBeliefSystem(id: string): Promise<BeliefSystem> {
  // Temporary mock data
  return {
    id,
    name: 'Health General',
    beliefs: [
      {
        id: 'belief-1',
        statement: 'Regular exercise improves overall health',
        confidence: 0.95,
      },
      {
        id: 'belief-2',
        statement: 'Diet significantly impacts health outcomes',
        confidence: 0.90,
      },
    ],
  };
}

export async function runSimulation(user_id: string): Promise<void> {
  // Temporary stub
  console.log(`Running simulation for user ${user_id}`);
}

export async function enqueueSimulation(userId: string, template = "default") {
  console.log('🚀 Starting simulation queue request:', { userId, template, API_BASE });
  
  try {
    const res = await fetch(`${API_BASE}/simulateConversation`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ user_id: userId, template })
    });
    
    console.log('📡 Response status:', res.status);
    console.log('📡 Response headers:', Object.fromEntries(res.headers.entries()));
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ API Error Response:', errorText);
      throw new Error(`Queue failed: ${res.status} ${res.statusText}`);
    }
    
    const data = await res.json();
    console.log('✅ Success response:', data);
    return data.data;
  } catch (error) {
    console.error('💥 Fetch error details:', error);
    
    // Provide more specific error messages
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Unable to connect to simulation service. Please check if the profile-mcp server is running on port 8010.');
    }
    
    throw error;
  }
}

// New function to get detailed data for a checklist item
export async function getChecklistItemData(userId: string, bucketCode: string): Promise<any> {
  // Use the new efficient endpoint in profile-mcp that handles sync and data formatting
  try {
    // For now, we need to use TEST_TOKEN and rely on the server to map it to the correct user
    // In the future, we'd have proper user-specific tokens
    const userHeaders = {
      'Authorization': `Bearer TEST_TOKEN`,
      'Content-Type': 'application/json',
    };
    
    const response = await fetch(`${API_BASE}/dd-data/checklist-item-data?bucket_code=${bucketCode}`, {
      headers: userHeaders,
    });
    
    if (!response.ok) {
      console.error(`DD data API error for ${bucketCode}:`, response.status, response.statusText);
      throw new Error(`Failed to fetch checklist item data: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ DD data success for ${bucketCode}:`, data);
    return data;
    
  } catch (error) {
    console.error(`Error fetching checklist item data for ${bucketCode}:`, error);
    
    // Return fallback data for better UX
    return _getClientFallbackData(bucketCode);
  }
}

// Helper function for client-side fallback data
function _getClientFallbackData(bucketCode: string): any {
  switch (bucketCode) {
    case 'health_device':
      return {
        type: 'health_device',
        title: 'Health Devices',
        data: {
          devices: [
            { 
              name: 'Apple Watch', 
              type: 'smartwatch', 
              status: 'connected', 
              last_sync: new Date().toISOString(), 
              source: 'Don\'t Die API'
            }
          ]
        }
      };

    case 'dd_score':
      return {
        type: 'dd_score',
        title: "Don't Die Score",
        data: {
          message: "Don't Die Score data is being loaded...",
          current_score: 'Loading...',
          trend: 'Collecting data',
          source: 'Apple Watch'
        }
      };

    case 'measurements':
      return {
        type: 'measurements',
        title: 'Physical Measurements',
        data: {
          message: "Physical measurements are being loaded...",
          measurements: []
        }
      };

    case 'capabilities':
      return {
        type: 'capabilities',
        title: 'Physical & Cognitive Capabilities',
        data: {
          message: "Capability assessments are being loaded...",
          physical: [],
          cognitive: []
        }
      };

    case 'biomarkers':
      return {
        type: 'biomarkers',
        title: 'Lab Results & Biomarkers',
        data: {
          labs: [],
          message: 'No biomarker data found. Upload lab results to Don\'t Die to see biomarkers here.'
        }
      };

    case 'protocols':
      return {
        type: 'protocols',
        title: 'Health Optimization Protocols',
        data: {
          message: "Protocols are being loaded...",
          active: [],
          completed: []
        }
      };

    case 'demographics':
      return {
        type: 'demographics',
        title: 'Demographics & Lifestyle',
        data: {
          message: 'Demographics data is being loaded...',
          basic: {},
          lifestyle: {}
        }
      };

    default:
      return {
        type: bucketCode,
        title: formatBucketLabel(bucketCode),
        data: { message: 'Data is being loaded...' }
      };
  }
}

// Add helper functions for triggering data sync
export async function syncUserData(userId: string, force: boolean = false): Promise<any> {
  const response = await fetch(`${API_BASE}/dd-data/sync/${userId}?force=${force}`, {
    method: 'POST',
    headers,
  });
  
  if (!response.ok) throw new Error('Failed to sync user data');
  return await response.json();
}

export async function getUserDataSyncStatus(userId: string): Promise<any> {
  const response = await fetch(`${API_BASE}/dd-data/status/${userId}`, {
    headers,
  });
  
  if (!response.ok) throw new Error('Failed to get sync status');
  return await response.json();
}

const formatBucketLabel = (bucketCode: string) => {
  const labels: Record<string, string> = {
    'health_device': 'Health Device',
    'dd_score': "Don't Die Score",
    'measurements': 'Measurements',
    'capabilities': 'Capabilities',
    'biomarkers': 'Biomarkers',
    'demographics': 'Demographics',
    'protocols': 'Protocols',
  };
  return labels[bucketCode] || bucketCode;
}; 