from fastapi import FastAPI

app = FastAPI()

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/upload_rule")
async def upload_rule():
    return {"ok": True}

print("Routes:", [r.path for r in app.routes if hasattr(r, 'path')])

