"""
Configuration settings for the Compliance Copilot application
"""
import os
from typing import Optional

class Config:
    """Application configuration"""
    
    # LandingAI Configuration
    LANDINGAI_API_KEY: Optional[str] = os.getenv("LANDINGAI_API_KEY", "ZXBydjdoejI2OWk2ZnR1Mzh4dDVoOm5JZ2JXdXZvUkNWS2JJQkZzdkJ0SkNjWVBjV0NkTTN5")
    
    # Pathway Configuration
    PATHWAY_API_KEY: Optional[str] = os.getenv("PATHWAY_API_KEY")
    
    # API Configuration
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))
    
    # Frontend Configuration
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    # File paths
    CONTRACTS_DIR: str = "backend/contracts/sample"
    RULES_DIR: str = "backend/rules/seed"
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    @classmethod
    def is_landingai_available(cls) -> bool:
        """Check if LandingAI is properly configured"""
        return cls.LANDINGAI_API_KEY is not None
    
    @classmethod
    def is_pathway_available(cls) -> bool:
        """Check if Pathway is properly configured"""
        return cls.PATHWAY_API_KEY is not None