from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel

from halo_backend import __version__

router = APIRouter(tags=["health"])


class HealthResponse(BaseModel):
    status: Literal["ok"]
    version: str
    stage: Literal["scaffold"]


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    """Process liveness only; no external-provider or clinical-readiness claim."""
    return HealthResponse(status="ok", version=__version__, stage="scaffold")
