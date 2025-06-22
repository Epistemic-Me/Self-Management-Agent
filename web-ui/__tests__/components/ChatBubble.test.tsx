import { render, screen } from '@testing-library/react'
import { ChatBubble } from '@/components/ChatBubble'

describe('ChatBubble', () => {
  it('renders user message correctly', () => {
    render(
      <ChatBubble
        role="user"
        content="Hello, this is a test message"
        timestamp="2024-01-15T10:30:00Z"
      />
    )

    expect(screen.getByText('Hello, this is a test message')).toBeInTheDocument()
    expect(screen.getByText(/2:30:00 AM/)).toBeInTheDocument()
  })

  it('renders assistant message correctly', () => {
    render(
      <ChatBubble
        role="assistant"
        content="This is an assistant response"
        timestamp="2024-01-15T10:31:00Z"
      />
    )

    expect(screen.getByText('This is an assistant response')).toBeInTheDocument()
  })

  it('renders system message with italic styling', () => {
    render(
      <ChatBubble
        role="system"
        content="System notification"
        timestamp="2024-01-15T10:32:00Z"
      />
    )

    const messageElement = screen.getByText('System notification')
    expect(messageElement).toBeInTheDocument()
  })
}) 