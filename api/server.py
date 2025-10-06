from fastapi import FastAPI
from pydantic import BaseModel
from load_documents import generate_data_store  # reuse your functions
from query_data import run_query

# uvicorn server:app --host 0.0.0.0 --port 8000

app = FastAPI()

class IndexBody(BaseModel):
    bucket: str
    path: str

class QueryBody(BaseModel):
    question: str

@app.post("/index")
def index(body: IndexBody):
    # call generate_data_store with Supabase args
    generate_data_store(pdf_path=None, supabase_bucket=body.bucket, supabase_path=body.path)
    return {"ok": True}

@app.post("/query")
def query(body: QueryBody):
    # refactor query_data.py to expose a function returning the text
    # e.g., response = run_query(body.question)
    # For now, you can temporarily wrap the current main() logic into a function
    # and return the string.
    response = run_query(body.question)  # implement in query_data.py
    return {"ok": True, **response}