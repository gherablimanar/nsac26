from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from halo_backend import __version__
from halo_backend.api.router import router
from halo_backend.core.config import Settings


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or Settings.from_env()
    application = FastAPI(
        title=settings.app_name,
        version=__version__,
        description="Backend scaffold. Health check only; feature modules are not implemented yet.",
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.allowed_origins),
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type", "Authorization"],
        allow_credentials=False,
    )
    application.include_router(router)
    return application


app = create_app()
