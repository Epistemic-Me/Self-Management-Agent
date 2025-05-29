import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from uuid import uuid4

@pytest.mark.asyncio
async def test_list_protocol_templates_empty():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/listProtocolTemplates")
    assert response.status_code == 200, response.text
    data = response.json()["data"]
    assert isinstance(data, list)

@pytest.mark.asyncio
async def test_generate_protocol_template(test_user):
    template_id = str(uuid4())
    user_id = test_user
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post("/generateProtocol", params={"user_id": user_id, "template_id": template_id})
    assert response.status_code == 404, response.text
