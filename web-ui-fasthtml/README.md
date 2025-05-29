# FastHTML UI for Self-Management Agent

A pure server-rendered HTML implementation of the Self-Management Agent UI using FastAPI, Jinja2 templates, and HTMX for dynamic interactions. This provides an exact functional replica of the Next.js web-ui while staying entirely in Python.

## Features

- **Pure Server-Rendered**: No client-side JavaScript framework needed
- **HTMX Integration**: Dynamic content updates without page refreshes
- **Dark Theme**: Matches the original web-ui design exactly
- **Responsive Layout**: Works on desktop and mobile devices
- **Real-time Chat**: Interactive chat interface with conversation management
- **Evaluation Dashboard**: View and analyze conversation metrics
- **User Workbench**: Manage simulated users and their profiles

## Architecture

```
/app/
  main.py                    # FastAPI application and routes
  templates/
    base.html               # Base template with navigation and styling
    chat.html               # End-user chat interface
    evaluation.html         # Conversation dataset dashboard
    conversation_detail.html # HTMX fragment for conversation details
    user_workbench.html     # Simulated users dashboard
    user_detail.html        # HTMX fragment for user profiles
  static/                   # Static files (favicon, logos)
requirements.txt            # Python dependencies
Dockerfile                  # Container configuration
```

## Technology Stack

- **FastAPI**: Modern, fast web framework for building APIs
- **Jinja2**: Powerful templating engine for HTML rendering
- **HTMX**: Enables AJAX, CSS Transitions, WebSockets, and Server Sent Events
- **Tailwind CSS**: Utility-first CSS framework via CDN
- **Lucide Icons**: Beautiful icon library for UI elements
- **httpx**: Async HTTP client for API calls

## Pages

### 1. Chat (`/chat`)
- Real-time messaging interface
- Automatic conversation initialization
- Message history display
- HTMX-powered async message sending

### 2. Evaluation (`/evaluation`)
- Conversation dataset overview
- Personalization metrics display
- Interactive conversation list
- Detailed conversation analysis with belief mapping

### 3. User Workbench (`/user-workbench`)
- Simulated user management
- User profile editing
- Philosophy and belief system configuration
- Simulation controls

## API Integration

The application integrates with:

- **Profile MCP** (`MCP_BASE`): Conversation management and storage
- **EM MCP** (`EM_MCP_BASE`): User simulation and belief systems

### Environment Variables

```env
MCP_BASE=http://localhost:8010          # Profile MCP service URL
EM_MCP_BASE=http://localhost:8120       # EM MCP service URL
TOKEN=TEST_TOKEN                        # Authentication token
```

## Installation & Setup

### Local Development

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set Environment Variables**
   ```bash
   export MCP_BASE=http://localhost:8010
   export EM_MCP_BASE=http://localhost:8120
   export TOKEN=your_token_here
   ```

3. **Run the Application**
   ```bash
   python -m uvicorn app.main:app --host 0.0.0.0 --port 3001 --reload
   ```

4. **Access the UI**
   ```
   http://localhost:3001
   ```

### Docker Deployment

1. **Build the Image**
   ```bash
   docker build -t web-ui-fasthtml .
   ```

2. **Run the Container**
   ```bash
   docker run -p 3001:3001 \
     -e MCP_BASE=http://profile-mcp:8010 \
     -e EM_MCP_BASE=http://em-mcp:8120 \
     -e TOKEN=your_token_here \
     web-ui-fasthtml
   ```

### Docker Compose

```yaml
version: '3.8'
services:
  web-ui-fasthtml:
    build: .
    ports:
      - "3001:3001"
    environment:
      - MCP_BASE=http://profile-mcp:8010
      - EM_MCP_BASE=http://em-mcp:8120
      - TOKEN=${TOKEN}
    depends_on:
      - profile-mcp
      - em-mcp
```

## HTMX Usage

The application uses HTMX for dynamic interactions:

### Chat Messages
```html
<form hx-post="/chat/send" hx-target="#messages-container" hx-swap="beforeend">
  <textarea name="message" required></textarea>
  <button type="submit">Send</button>
</form>
```

### Conversation Selection
```html
<div hx-get="/conversation/{{id}}" hx-target="#conversation-detail">
  Click to load conversation
</div>
```

### User Profile Loading
```html
<div hx-get="/user/{{user_id}}" hx-target="#user-detail">
  Click to view user profile
</div>
```

## Styling

The application uses Tailwind CSS with a custom dark theme that matches the original design:

- **Colors**: Consistent with the shadcn/ui color palette
- **Typography**: Inter font family for modern appearance
- **Components**: Card-based layouts with proper spacing
- **Icons**: Lucide icons for consistent iconography

## Development Notes

### Adding New Pages

1. Create a new template in `app/templates/`
2. Add a route in `app/main.py`
3. Update navigation in `base.html` if needed

### HTMX Best Practices

- Use fragments for partial page updates
- Include proper `hx-target` and `hx-swap` attributes
- Initialize Lucide icons after HTMX swaps
- Handle loading states appropriately

### API Integration

- All API calls use async/await with httpx
- Proper error handling with fallback content
- Mock data for development when services are unavailable

## Comparison with Next.js Version

| Feature | Next.js | FastHTML |
|---------|---------|----------|
| Framework | React | FastAPI + Jinja2 |
| Client-side JS | React components | HTMX + vanilla JS |
| Styling | Tailwind + CSS-in-JS | Tailwind via CDN |
| State Management | React hooks | Server state + HTMX |
| Build Process | Next.js build | No build needed |
| Development | Hot reload | uvicorn --reload |
| Bundle Size | ~500KB+ | ~50KB |
| SEO | SSR/SSG | Server-rendered |

## Performance Benefits

- **Smaller Bundle**: No large JavaScript framework
- **Faster Initial Load**: Server-rendered HTML
- **Lower Memory Usage**: Less client-side state
- **Simpler Deployment**: Single Python process
- **Better Caching**: Static HTML responses

## Troubleshooting

### Common Issues

1. **HTMX not working**: Check that scripts are loaded and Lucide icons are initialized
2. **API errors**: Verify MCP services are running and accessible
3. **Styling issues**: Ensure Tailwind CSS CDN is loaded
4. **Template errors**: Check Jinja2 syntax and variable names

### Debugging

Enable FastAPI debug mode:
```python
app = FastAPI(debug=True)
```

Check HTMX requests in browser dev tools Network tab.

## Contributing

1. Follow Python code style guidelines
2. Use semantic HTML structure
3. Maintain HTMX attribute consistency
4. Test all interactive features
5. Update documentation for new features

This FastHTML implementation provides the same functionality as the Next.js version while being simpler to deploy and maintain, making it ideal for server-side focused applications. 