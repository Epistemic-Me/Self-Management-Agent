from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from app.routers import checklist, protocols, trend, chat, dialectic_db, simulation, user, dd_proxy, dd_data, project, trace, prompt, prompt_test
from fastapi_mcp import FastApiMCP
from app.routers import selfmodel, belief, measurement, file
from app.deps import lifespan, get_session
from sqlmodel import select
import uvicorn

app = FastAPI(lifespan=lifespan, openapi_version="3.1.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom middleware to handle CORS for all routes
@app.middleware("http")
async def cors_handler(request: Request, call_next):
    response = await call_next(request)
    origin = request.headers.get('origin')
    if origin in ["http://localhost:3000", "http://127.0.0.1:3000"]:
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Authorization, Content-Type'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
    return response

# Handle preflight requests
@app.options("/{full_path:path}")
async def preflight_handler(request: Request, full_path: str):
    return Response(
        status_code=200,
        headers={
            'Access-Control-Allow-Origin': request.headers.get('origin', '*'),
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Authorization, Content-Type',
            'Access-Control-Allow-Credentials': 'true',
        }
    )

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint that verifies database connectivity."""
    try:
        # Test database connection using the session generator
        async for session in get_session():
            await session.execute(select(1))
            break  # Exit after first iteration
        return {"status": "healthy", "service": "profile-mcp"}
    except Exception as e:
        return {"status": "unhealthy", "service": "profile-mcp", "error": str(e)}

app.include_router(selfmodel.router)
app.include_router(belief.router)
app.include_router(measurement.router)
app.include_router(file.router)
app.include_router(checklist.router)
app.include_router(protocols.router)
app.include_router(trend.router)
app.include_router(chat.router)
app.include_router(dialectic_db.router)
app.include_router(simulation.router)
app.include_router(user.router)
app.include_router(dd_proxy.router)
app.include_router(dd_data.router)
app.include_router(project.router)
app.include_router(trace.router, prefix="/api/traces")
app.include_router(prompt.router)
app.include_router(prompt_test.router)

mcp = FastApiMCP(app)
mcp.mount()

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8010, reload=True)
