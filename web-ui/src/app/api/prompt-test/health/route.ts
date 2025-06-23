import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Proxy the request to the profile-mcp service
    const response = await fetch('http://localhost:8010/api/prompt-test/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      return NextResponse.json(
        { status: 'unhealthy', error: errorData.detail || `API Error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Health check proxy error:', error);
    return NextResponse.json(
      { status: 'unhealthy', error: 'Failed to connect to backend service' },
      { status: 500 }
    );
  }
}