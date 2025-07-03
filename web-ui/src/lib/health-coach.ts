/**
 * Health Coach Agent integration
 */
import type { ChatRequest, HealthCoachResponse, Cohort } from '@/types/health-coach';

const HEALTH_COACH_BASE_URL = process.env.NEXT_PUBLIC_HEALTH_COACH_URL || 'http://localhost:8130';

export class HealthCoachService {
  private baseURL: string;
  private apiKey?: string;

  constructor() {
    this.baseURL = HEALTH_COACH_BASE_URL;
    this.apiKey = process.env.NEXT_PUBLIC_HEALTH_COACH_API_KEY;
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    return headers;
  }

  async sendMessage(request: ChatRequest): Promise<HealthCoachResponse> {
    const response = await fetch(`${this.baseURL}/chat/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        ...request,
        include_provenance: true, // Always include provenance for evaluation
      }),
    });

    if (!response.ok) {
      throw new Error(`Health Coach API error: ${response.status}`);
    }

    return response.json();
  }

  async sendMessageStream(
    request: ChatRequest,
    onMessage: (message: any) => void
  ): Promise<void> {
    const response = await fetch(`${this.baseURL}/chat/stream`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        ...request,
        include_provenance: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Health Coach Stream API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body reader available');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              onMessage(data);
            } catch (e) {
              console.warn('Failed to parse SSE message:', line);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async getCohorts(): Promise<Cohort[]> {
    const response = await fetch(`${this.baseURL}/cohorts/`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch cohorts: ${response.status}`);
    }

    return response.json();
  }

  async getSession(sessionId: string) {
    const response = await fetch(`${this.baseURL}/chat/session/${sessionId}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch session: ${response.status}`);
    }

    return response.json();
  }

  async getSessionForEvaluation(sessionId: string) {
    const response = await fetch(`${this.baseURL}/chat/session/${sessionId}/evaluation`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch session for evaluation: ${response.status}`);
    }

    return response.json();
  }

  async getIntentHierarchy() {
    const response = await fetch(`${this.baseURL}/intents/`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch intent hierarchy: ${response.status}`);
    }

    return response.json();
  }

  async evaluateResponse(data: {
    response: string;
    routing_decision: any;
    original_query: string;
    user_cohort: string;
  }) {
    const response = await fetch(`${this.baseURL}/evaluate/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to evaluate response: ${response.status}`);
    }

    return response.json();
  }
}

// Singleton instance
export const healthCoachService = new HealthCoachService();