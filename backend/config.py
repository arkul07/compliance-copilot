from dotenv import load_dotenv
import os

load_dotenv()
LANDINGAI_API_KEY = os.getenv("LANDINGAI_API_KEY", "")

