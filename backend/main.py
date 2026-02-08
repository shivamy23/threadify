from fastapi import FastAPI

app = FastAPI(title="Threadify Backend")

@app.get("/")
def root():
    return {"status": "Backend is running"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/test")
def test_api(data: dict):
    return {
        "message": "API working",
        "received": data
    }
