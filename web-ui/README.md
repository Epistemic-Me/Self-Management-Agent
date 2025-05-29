# Self-Management Agent Web UI

A Next.js 14 web application providing both developer and user interfaces for the Self-Management Agent platform.

## Features

### User Interface
- **Chat Interface** (`/chat`) - End-user chat window with real-time conversation
- **Message Input** - Textarea with send button and keyboard shortcuts
- **Chat Bubbles** - Styled message display with timestamps

### Developer Interface
- **Evaluation Dashboard** (`/evaluation`) - Conversation dataset analysis
  - Conversation list with status indicators
  - Detailed conversation view with message history
  - Radar chart metrics visualization (7 axes)
  - Belief map with core and related beliefs
- **User Workbench** (`/user-workbench`) - Simulated user management
  - User list with demographic tags
  - Profile tabs: Demographics, Health Metrics, Preferences
  - Philosophy accordion with belief counts
  - **Run simulation functionality** with queue integration
  - **Toast notifications** for simulation feedback
  - Real-time simulation status updates

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS + shadcn/ui components
- **Icons**: Lucide React
- **Charts**: Recharts (Radar charts, Sparklines)
- **Forms**: react-hook-form
- **Data Fetching**: SWR
- **Theming**: class-variance-authority
- **Testing**: Jest + @testing-library/react
- **E2E Testing**: Cypress

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── chat/              # Chat interface
│   ├── evaluation/        # Developer evaluation view
│   ├── user-workbench/    # Developer user workbench
│   ├── layout.tsx         # Root layout with sidebar
│   └── page.tsx           # Root redirect to /chat
├── components/            # Reusable components
│   ├── ui/               # shadcn/ui base components
│   │   ├── toast.tsx     # Toast notification component
│   │   ├── toaster.tsx   # Toast provider wrapper
│   │   ├── use-toast.ts  # Toast hook and state management
│   │   └── ...          # Other UI components
│   ├── SidebarNav.tsx    # Navigation sidebar
│   ├── ConversationList.tsx
│   ├── ConversationDetail.tsx
│   ├── RadarMetrics.tsx  # Recharts radar visualization
│   ├── BeliefMap.tsx     # Collapsible belief tree
│   ├── UserList.tsx
│   ├── UserProfilePane.tsx
│   ├── PhilosophyAccordion.tsx
│   ├── MessageInput.tsx
│   └── ChatBubble.tsx
└── lib/
    ├── api.ts            # API client functions
    └── utils.ts          # Utility functions
```

## API Integration

### Profile MCP (Port 8010)
- `GET /listConversations` - Fetch conversation list
- `GET /getConversation?id=` - Get conversation details with metrics
- `POST /startConversation` - Create new conversation
- `POST /appendTurn` - Add message to conversation
- `GET /getProgressTrend` - Health metrics trends
- `POST /simulateConversation` - Queue simulation for user with template

### EM MCP (Port 8120)
- `GET /listSimulatedUsers` - Fetch simulated users (mock data)
- `GET /getSimulatedUser?id=` - Get user profile
- `GET /getBeliefSystem?id=` - Get belief system details
- `POST /runSimulation` - Start user simulation (deprecated)

## Environment Variables

Create a `.env.local` file:

```bash
NEXT_PUBLIC_MCP_BASE=http://localhost:8010
NEXT_PUBLIC_EM_MCP=http://localhost:8120
NEXT_PUBLIC_TOKEN=TEST_TOKEN
```

## Development

### Prerequisites
- Node.js 20 (recommended) or 18+
- npm or yarn

### Setup

```bash
# If using nvm, install and use Node.js 20
nvm install 20
nvm use 20

# Or if using Homebrew
brew install node@20

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

### Available Scripts

```bash
npm run dev          # Start development server (port 3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run Jest tests
npm run e2e          # Run Cypress e2e tests
```

## Testing

### Unit Tests
```bash
npm run test
```

Tests use Jest + @testing-library/react for component testing.

### E2E Tests
```bash
# Start dev server first
npm run dev

# Run Cypress tests
npm run e2e
```

Example tests verify:
- Evaluation page loads conversation dataset
- Sidebar list has items
- Conversation selection shows radar chart
- **User workbench simulation queue functionality**
- **Toast notifications for success/error states**
- **API interceptors for simulation endpoints**

## Deployment

### Docker

```bash
# Build image
docker build -t self-management-web-ui .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_MCP_BASE=http://localhost:8010 \
  -e NEXT_PUBLIC_EM_MCP=http://localhost:8120 \
  -e NEXT_PUBLIC_TOKEN=TEST_TOKEN \
  self-management-web-ui
```

### Production Build

```bash
npm run build
npm run start
```

## Design System

### Theme
- **Dark Mode**: Default theme with dark background
- **Colors**: CSS custom properties for consistent theming
- **Typography**: Inter font family
- **Spacing**: Tailwind CSS spacing scale

### Components
- **Sidebar Navigation**: Fixed left sidebar with route indicators
- **Status Pills**: Color-coded conversation status (Reviewed, Edited, New, Simulating)
- **Radar Chart**: 7-axis metrics visualization
- **Belief Tree**: Collapsible core/related belief structure
- **Tag Pills**: User demographic and philosophy tags
- **Responsive Layout**: Mobile-friendly responsive design

## Data Flow

1. **Authentication**: Bearer token from environment variables
2. **SWR Caching**: Automatic data fetching and caching with keys:
   - `/convs` - Conversation list
   - `/conv/[id]` - Individual conversation
   - `/users` - Simulated users
   - `/user/[id]` - User profile
3. **Real-time Updates**: Manual refresh on user actions
4. **Error Handling**: Graceful fallbacks for API failures

## Future Enhancements

- [ ] Real-time WebSocket connections for live chat
- [ ] Advanced filtering and search for conversations
- [ ] Export functionality for conversation data
- [ ] User authentication and role-based access
- [ ] Advanced analytics and reporting
- [ ] Mobile app support
- [ ] Internationalization (i18n)

## Contributing

1. Follow the existing code style and patterns
2. Add tests for new components
3. Update documentation for new features
4. Use semantic commit messages

## License

This project is part of the Epistemic-Me-Org platform. 