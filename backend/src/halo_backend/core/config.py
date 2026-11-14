import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    app_name: str = "HALO Backend"
    allowed_origins: tuple[str, ...] = ("http://localhost:5173",)

    @classmethod
    def from_env(cls) -> "Settings":
        origins = os.getenv("HALO_ALLOWED_ORIGINS", "http://localhost:5173")
        return cls(
            app_name=os.getenv("HALO_APP_NAME", "HALO Backend"),
            allowed_origins=tuple(
                origin.strip() for origin in origins.split(",") if origin.strip()
            ),
        )
