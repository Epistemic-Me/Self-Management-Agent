import os
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, Request, Form, HTTPException, Depends
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
import httpx
from dotenv import load_dotenv

load_dotenv()

# Configuration
MCP_BASE = os.getenv("MCP_BASE", "http://localhost:8010")
EM_MCP_BASE = os.getenv("EM_MCP_BASE", "http://localhost:8120")
TOKEN = os.getenv("TOKEN", "TEST_TOKEN")

# FastAPI app setup
app = FastAPI(title="Self-Management Agent UI")
templates = Jinja2Templates(directory="app/templates")

# Static files
try:
    app.mount("/static", StaticFiles(directory="app/static"), name="static")
except RuntimeError:
    # Directory doesn't exist yet
    pass

def get_headers():
    return {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}

# Mock data for simulated users (until EM MCP is ready)
MOCK_USERS = [
    {
        "id": "user-1",
        "demographics": {
            "age": 35,
            "gender": "Male",
            "location": "San Francisco",
            "occupation": "Software Developer"
        },
        "tags": ["Bio-Hackers", "Tech-Enthusiasts", "Quantified-Self"],
        "philosophies": [
            {
                "name": "Health General",
                "root_count": 2,
                "sub_count": 4,
                "belief_system_id": "bs-1"
            },
            {
                "name": "Sleep Optimization", 
                "root_count": 1,
                "sub_count": 3,
                "belief_system_id": "bs-2"
            }
        ]
    },
    {
        "id": "user-2",
        "demographics": {
            "age": 28,
            "gender": "Female",
            "location": "New York",
            "occupation": "Data Scientist"
        },
        "tags": ["Parents", "Time-Starved"],
        "philosophies": [
            {
                "name": "Health General",
                "root_count": 3,
                "sub_count": 6,
                "belief_system_id": "bs-3"
            }
        ]
    },
    {
        "id": "user-3",
        "demographics": {
            "age": 42,
            "gender": "Male",
            "location": "Austin",
            "occupation": "Fitness Enthusiast"
        },
        "tags": ["Athletes", "Gym-Regulars"],
        "philosophies": [
            {
                "name": "Health General",
                "root_count": 1,
                "sub_count": 2,
                "belief_system_id": "bs-4"
            }
        ]
    }
]

# Routes

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "web-ui-fasthtml"}

@app.get("/", response_class=HTMLResponse)
async def root():
    return RedirectResponse(url="/chat")

@app.get("/chat", response_class=HTMLResponse)
async def chat_page(request: Request):
    return templates.TemplateResponse("chat.html", {"request": request})

@app.post("/chat/start", response_class=HTMLResponse)
async def start_conversation():
    """Start a new conversation and return the conversation ID"""
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.post(f"{MCP_BASE}/startConversation", headers=get_headers(), json={})
            if response.status_code == 200:
                data = response.json()
                return HTMLResponse(content=f'<div hx-vals=\'{{"conversation_id": "{data["data"]["conversation_id"]}"}}\' id="conversation-id"></div>')
            else:
                return HTMLResponse(content=f'<div class="text-red-400">Error: Failed to start conversation (Status: {response.status_code})</div>')
        except httpx.ConnectError:
            # Fallback to demo mode when MCP service is not available
            demo_conversation_id = f"demo-{datetime.now().strftime('%Y%m%d%H%M%S')}"
            return HTMLResponse(content=f'<div hx-vals=\'{{"conversation_id": "{demo_conversation_id}"}}\' id="conversation-id"></div>')
        except httpx.TimeoutException:
            demo_conversation_id = f"demo-{datetime.now().strftime('%Y%m%d%H%M%S')}"
            return HTMLResponse(content=f'<div hx-vals=\'{{"conversation_id": "{demo_conversation_id}"}}\' id="conversation-id"></div>')
        except Exception as e:
            return HTMLResponse(content=f'<div class="text-red-400">Error: {str(e)}</div>')

@app.post("/chat/send", response_class=HTMLResponse)
async def send_message(request: Request, message: str = Form(...), conversation_id: str = Form(...)):
    """Send a message and get response"""
    # Check if this is demo mode
    is_demo = conversation_id.startswith("demo-")
    
    if not is_demo:
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                # Add user message
                await client.post(f"{MCP_BASE}/appendTurn", 
                                headers=get_headers(),
                                json={
                                    "conversation_id": conversation_id,
                                    "role": "user", 
                                    "content": message
                                })
                
                # Simulate assistant response
                assistant_response = f'I understand you said: "{message}". This is a placeholder response from the MCP service. In a real implementation, this would be connected to your AI agent.'
                
                await client.post(f"{MCP_BASE}/appendTurn",
                                headers=get_headers(), 
                                json={
                                    "conversation_id": conversation_id,
                                    "role": "assistant",
                                    "content": assistant_response
                                })
                
            except (httpx.ConnectError, httpx.TimeoutException):
                # Fall back to demo mode if MCP service is unavailable
                assistant_response = f'Demo mode: I understand you said: "{message}". This is a demo response since the MCP service is not available. The UI is fully functional!'
            except Exception as e:
                return HTMLResponse(content=f'<div class="text-red-400">Error: {str(e)}</div>')
    else:
        # Demo mode response
        assistant_response = f'Demo mode: I understand you said: "{message}". This is a demo response showing the chat functionality. The UI layout and interactions are fully working!'
    
    # Return both messages with improved styling
    user_bubble = f'''
    <div class="flex justify-end mb-4">
        <div class="max-w-xs lg:max-w-md px-4 py-2 bg-primary text-primary-foreground rounded-lg">
            <p class="text-sm">{message}</p>
            <p class="text-xs opacity-75 mt-1">{datetime.now().strftime("%H:%M")}</p>
        </div>
    </div>
    '''
    
    assistant_bubble = f'''
    <div class="flex justify-start mb-4">
        <div class="max-w-xs lg:max-w-md px-4 py-2 bg-muted text-foreground rounded-lg border border-border">
            <p class="text-sm">{assistant_response}</p>
            <p class="text-xs text-muted-foreground mt-1">{datetime.now().strftime("%H:%M")}</p>
        </div>
    </div>
    '''
    
    return HTMLResponse(content=user_bubble + assistant_bubble)

@app.get("/evaluation", response_class=HTMLResponse)
async def evaluation_page(request: Request):
    """Evaluation dashboard page"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{MCP_BASE}/listConversations?limit=100", headers=get_headers())
            if response.status_code == 200:
                conversations = response.json().get("data", [])
            else:
                conversations = []
        except Exception:
            conversations = []
    
    return templates.TemplateResponse("evaluation.html", {
        "request": request,
        "conversations": conversations
    })

@app.get("/conversation/{conversation_id}", response_class=HTMLResponse)
async def conversation_detail(conversation_id: str, request: Request):
    """Get conversation detail for HTMX"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{MCP_BASE}/getConversation?id={conversation_id}", headers=get_headers())
            if response.status_code == 200:
                conversation = response.json()["data"]
                return templates.TemplateResponse("conversation_detail.html", {
                    "request": request,
                    "conversation": conversation
                })
            else:
                return HTMLResponse(content='<div class="text-red-500 p-4">Failed to load conversation</div>')
        except Exception as e:
            return HTMLResponse(content=f'<div class="text-red-500 p-4">Error: {str(e)}</div>')

@app.get("/user-workbench", response_class=HTMLResponse)
async def user_workbench_page(request: Request):
    """User workbench page"""
    # Using mock data for now
    users = MOCK_USERS
    
    return templates.TemplateResponse("user_workbench.html", {
        "request": request,
        "users": users
    })

@app.get("/user/{user_id}", response_class=HTMLResponse)
async def user_detail(user_id: str, request: Request):
    """Get user detail for HTMX"""
    # Find user in mock data
    user = next((u for u in MOCK_USERS if u["id"] == user_id), None)
    
    if not user:
        return HTMLResponse(content='<div class="text-red-500 p-4">User not found</div>')
    
    return templates.TemplateResponse("user_detail.html", {
        "request": request,
        "user": user
    })

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3001) 