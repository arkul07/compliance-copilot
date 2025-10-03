from fastapi import FastAPI, UploadFile, File

app = FastAPI()

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/upload_rule")
async def upload_rule(file: UploadFile = File(...)):
    return {"ok": True}

@app.get("/check")
def check():
    return {"results": []}

print("Routes:")
for route in app.routes:
    if hasattr(route, 'methods'):
        print(f'{route.methods} {route.path}')

