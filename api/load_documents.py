import argparse
from langchain_community.document_loaders import UnstructuredMarkdownLoader, PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from langchain.evaluation import load_evaluator
import os
from langchain_chroma import Chroma
from dotenv import load_dotenv
import os
import shutil
from langchain_huggingface import HuggingFaceEmbeddings

DATA_PATH = "data/alice_short.md"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv()
load_dotenv(os.path.join(BASE_DIR, "consts.env"))

CHROMA_PATH = os.getenv("CHROMA_PATH", "chroma")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf_path", type=str, default=None, help="Local path to a PDF to index")
    args = parser.parse_args()
    generate_data_store(pdf_path=args.pdf_path)

def generate_data_store(pdf_path: str | None = None):
    documents = load_documents(pdf_path=pdf_path)
    chunks = split_text(documents)
    save_to_chroma(chunks)

def load_documents(pdf_path: str | None = None):
    if pdf_path:
        if not os.path.exists(pdf_path):
            raise FileNotFoundError(f"PDF file not found: {pdf_path}")
        loader = PyPDFLoader(pdf_path)
        return loader.load()
    loader = UnstructuredMarkdownLoader(DATA_PATH)
    return loader.load()

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
    if os.path.exists(CHROMA_PATH):
        shutil.rmtree(CHROMA_PATH)

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
    print(f"Saved {len(chunks)} chunks to {CHROMA_PATH}.")

if __name__ == "__main__":
    main()