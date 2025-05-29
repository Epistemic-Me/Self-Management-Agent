from fastapi import APIRouter, Depends, UploadFile, File as FastAPIFile, HTTPException
from app.deps import get_minio, get_current_user
import uuid
import os

router = APIRouter()

@router.post("/uploadUserFile", tags=["file"], operation_id="upload_user_file")
async def upload_user_file(
    user_id: uuid.UUID,
    upload: UploadFile = FastAPIFile(...),
    minio = Depends(get_minio),
    _user: str = Depends(get_current_user),
):
    ext = os.path.splitext(upload.filename)[-1]
    file_uuid = str(uuid.uuid4())
    s3_key = f"user/{user_id}/{file_uuid}{ext}"
    content = await upload.read()
    minio.upload_fileobj(
        Fileobj=content,
        Bucket="profile-files",
        Key=s3_key,
        ExtraArgs={"ContentType": upload.content_type},
    )
    return {"status": "ok", "data": {"s3_key": s3_key}}
