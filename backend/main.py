import os
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load API Key from .env
load_dotenv()
HIBP_API_KEY = os.getenv("HIBP_API_KEY")

app = FastAPI(title="Data Exposure Tracker API")

# Enable CORS for React frontend (localhost:5173 or whatever port you use)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Data Exposure Tracker API is running"}

@app.get("/api/check-email/{email}")
async def check_email(email: str):
    if not HIBP_API_KEY or HIBP_API_KEY == "YOUR_API_KEY_HERE":
        raise HTTPException(status_code=500, detail="HIBP API Key not configured in backend.")

    url = f"https://haveibeenpwned.com/api/v3/breachedaccount/{email.strip()}?truncateResponse=false"
    headers = {
        "hibp-api-key": HIBP_API_KEY,
        "user-agent": "DataExposureTracker-FastAPI"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers)
            
            if response.status_code == 404:
                return []  # No breaches found
            
            if response.status_code == 401:
                raise HTTPException(status_code=401, detail="Invalid HIBP API Key.")
            
            if response.status_code == 429:
                raise HTTPException(status_code=429, detail="Rate limit exceeded. Please try again in a few seconds.")

            response.raise_for_status()
            return response.json()
            
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Backend Error: {str(e)}")
