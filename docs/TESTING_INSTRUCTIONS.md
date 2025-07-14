# Testing Instructions for Health Coach Agent PR

## Overview
This PR implements a comprehensive AI Health Coach Agent with hierarchical constraint architecture and browser-based component testing capabilities.

## Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ and npm
- OpenAI API key configured

## Environment Setup

1. **Start all services:**
   ```bash
   cd Self-Management-Agent
   docker compose up -d
   ```

2. **Start the web UI:**
   ```bash
   cd web-ui
   npm install
   npm run dev
   ```

3. **Verify services are running:**
   - Web UI: http://localhost:3000
   - Health Coach MCP: http://localhost:8130/docs
   - Profile MCP: http://localhost:8010/docs

## Manual Testing Steps

### 1. Agent Evaluation Interface
**Test Location:** http://localhost:3000/agent-evaluation

**Steps:**
1. Navigate to Agent Evaluation page
2. Verify hierarchical tree displays with:
   - 3 cohorts (Health Coaching, Fitness Training, Wellness Management)
   - 8 intents across all cohorts
   - 24 sub-intents total
3. Confirm component type badges show "R" for retrievers, "T" for tools
4. Click test icon (🧪) on any sub-intent node
5. Verify modal opens with correct component type interface

### 2. Component Testing Modal
**Test each component type:**

**Router Testing:**
1. Click test icon on any router node
2. Enter query: "I need help with meal planning"
3. Click "Test Router"
4. Verify response shows routing decision with confidence score

**Retriever Testing:**
1. Click test icon on retriever node (e.g., "Meal Planning Basics")
2. Enter query: "healthy meal ideas for vegetarians"
3. Click "Test Retriever" 
4. Verify response shows relevant retrieved information

**Tool Testing:**
1. Click test icon on tool node (e.g., "Meal Plan Generator")
2. Enter parameters: `{"dietaryRestrictions": "vegetarian", "calories": 2000}`
3. Click "Test Tool"
4. Verify response shows tool execution results

### 3. Personalization Contexts
**Test Location:** http://localhost:3000/personalization-contexts

**Steps:**
1. Navigate to Personalization Contexts page
2. Verify page loads without errors
3. Check Alert component displays properly
4. Test context configuration interface

### 4. API Endpoints
**Test health-coach-mcp endpoints:**

```bash
# Test router endpoint
curl -X POST http://localhost:8130/test/router \
  -H "Content-Type: application/json" \
  -d '{"query": "I need nutrition advice"}'

# Test retriever endpoint  
curl -X POST http://localhost:8130/test/retriever \
  -H "Content-Type: application/json" \
  -d '{"nodeId": "nutrition-basics", "query": "healthy eating"}'

# Test tool endpoint
curl -X POST http://localhost:8130/test/tool \
  -H "Content-Type: application/json" \
  -d '{"nodeId": "meal-planner", "parameters": {"calories": 2000}}'
```

## Automated Testing

### Unit Tests
```bash
cd web-ui
npm test -- --testPathPattern=health-coach
```

### Integration Tests
```bash
cd web-ui
npm run test:integration
```

### API Tests
```bash
# Test health-coach-mcp service
curl http://localhost:8130/health
# Should return {"status": "healthy"}
```

## Expected Results

### Component Testing Modal
- ✅ Modal opens correctly positioned at top of viewport
- ✅ Shows appropriate interface based on component type
- ✅ Handles test execution with loading states
- ✅ Displays results or error messages appropriately
- ✅ Closes properly when dismiss button clicked

### Hierarchical Tree
- ✅ All 24 sub-intents display with correct type badges
- ✅ Test icons appear on sub-intent nodes only
- ✅ Tree structure matches constraint architecture
- ✅ Node types correctly identified (Router/Retriever/Tool)

### API Integration
- ✅ All health-coach-mcp endpoints respond successfully
- ✅ Router returns routing decisions with confidence scores
- ✅ Retriever returns relevant information
- ✅ Tool returns execution results

## Common Issues

### Database Connection Error
If health-coach-mcp fails to start with database error:
```bash
docker compose down
docker volume rm self-management-agent_postgres_data
docker compose up postgres -d
# Wait 30 seconds for initialization
docker compose up health-coach-mcp -d
```

### Missing Alert Component
If personalization-contexts page shows module error:
- Verify `/web-ui/src/components/ui/alert.tsx` exists
- Check class-variance-authority dependency installed

### Port Conflicts
If services fail to start:
- Check ports 3000, 8130, 8010, 5434, 6379, 9000 are available
- Stop conflicting services or update docker-compose.yml ports

## Performance Expectations
- Page load times: < 2 seconds
- Component test execution: < 5 seconds
- Modal open/close: < 500ms
- API response times: < 3 seconds