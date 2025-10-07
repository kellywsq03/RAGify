import argparse
import os
import shutil
import tempfile
from typing import Optional

from dotenv import load_dotenv
from langchain_community.document_loaders import UnstructuredMarkdownLoader, PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

try:
    from supabase import create_client, Client
except Exception:
    create_client = None  # type: ignore
    Client = None  # type: ignore

DATA_PATH = "data/alice_short.md"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BASE_DIR, "consts.env")
load_dotenv(ENV_PATH)

CHROMA_PATH = os.getenv("CHROMA_PATH", "chroma")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf_path", type=str, default=None, help="Local path to a PDF to index")
    parser.add_argument("--supabase_bucket", type=str, default=None, help="Supabase Storage bucket name")
    parser.add_argument("--supabase_path", type=str, default=None, help="Supabase Storage object path (e.g., uploads/file.pdf)")
    args = parser.parse_args()

    generate_data_store(
        pdf_path=args.pdf_path,
        supabase_bucket=args.supabase_bucket,
        supabase_path=args.supabase_path,
    )

def generate_data_store(pdf_path: Optional[str] = None, supabase_bucket: Optional[str] = None, supabase_path: Optional[str] = None):
    documents = load_documents(pdf_path=pdf_path, supabase_bucket=supabase_bucket, supabase_path=supabase_path)
    chunks = split_text(documents)
    save_to_chroma(chunks)

def load_documents(pdf_path: Optional[str] = None, supabase_bucket: Optional[str] = None, supabase_path: Optional[str] = None):
    if pdf_path:
        if not os.path.exists(pdf_path):
            raise FileNotFoundError(f"PDF file not found: {pdf_path}")
        return PyPDFLoader(pdf_path).load()

    if supabase_bucket and supabase_path:
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in env.")
        if create_client is None:
            raise RuntimeError("supabase-py is not installed. Install with: pip install supabase")
        local_pdf = download_pdf_from_supabase(supabase_bucket, supabase_path)
        with open(local_pdf, "rb") as f:
            head = f.read(200)
            print("📄 File header preview:", head[:20])
        try:
            return PyPDFLoader(local_pdf).load()
        finally:
            pass

def download_pdf_from_supabase(bucket: str, path: str) -> str:
    """Download a PDF from Supabase Storage to a temporary local file and return the file path."""
    assert SUPABASE_URL and SUPABASE_KEY
    client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    resp = client.storage.from_(bucket).download(path)
    if isinstance(resp, bytes):
        data_bytes = resp
    else:
        # Some client versions may return dict-like with data attribute
        data_bytes = getattr(resp, "data", None)
        if data_bytes is None:
            raise RuntimeError("Failed to download file from Supabase Storage")

    fd, tmp_path = tempfile.mkstemp(prefix="supabase_pdf_", suffix=".pdf")
    os.close(fd)
    with open(tmp_path, "wb") as f:
        f.write(data_bytes)
    return tmp_path

def split_text(documents: list[Document]):
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50,
        length_function=len,
        add_start_index=True,
    )
    chunks = text_splitter.split_documents(documents)
    print(f"Split {len(documents)} documents into {len(chunks)} chunks.")

    if len(chunks) > 10:
        document = chunks[10]
        print("content:", document.page_content)
        print(document.metadata)

    return chunks

def save_to_chroma(chunks: list[Document]):
    # Clear out the database first.
    # if os.path.exists(CHROMA_PATH):
    #     try:
    #         shutil.rmtree(CHROMA_PATH)
    #     except Exception as e:
    #         print(f"Warning: could not delete {CHROMA_PATH}: {e}")

    # Create a new DB from the documents.
    model_name = "sentence-transformers/all-mpnet-base-v2"
    model_kwargs = {"device": "cpu"}
    encode_kwargs = {"normalize_embeddings": False}
    embeddings = HuggingFaceEmbeddings(
        model_name=model_name,
        model_kwargs=model_kwargs,
        encode_kwargs=encode_kwargs,
    )
    db = Chroma.from_documents(chunks, embeddings, persist_directory=CHROMA_PATH)
    # Delete the old collection (if any)
    try:
        db.delete_collection()
    except Exception:
        pass  # ignore if no collection yet
    # Recreate the collection cleanly
    db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embeddings, collection_name="default")
    db.add_documents(chunks)
    print(f"Saved {len(chunks)} chunks to {CHROMA_PATH}.")

if __name__ == "__main__":
    main()