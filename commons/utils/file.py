import os
from fastapi import HTTPException
from config import settings

async def delete_file(file_path: str):
    absolute_path = os.path.join(settings.UPLOAD_DIR, os.path.basename(file_path))

    try:
        if os.path.isfile(absolute_path):
            os.remove(absolute_path)
    except Exception as e:
        raise HTTPException(500, f"File delete failed: {absolute_path}")