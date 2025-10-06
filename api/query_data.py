import argparse
from langchain_chroma import Chroma
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.prompts import ChatPromptTemplate
import os
from dotenv import load_dotenv

CHROMA_PATH = "chroma"

PROMPT_TEMPLATE = """
Answer the question based only on the following context:

{context}

---

Answer the question based on the above context: {question}
"""

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv()
load_dotenv(os.path.join(BASE_DIR, "consts.env"))

CHROMA_PATH = os.getenv("CHROMA_PATH", "chroma")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")


def run_query(query_text: str) -> dict:
    """Run a RAG query against the local Chroma index and return a formatted string.

    Returns a string like: "Response: ...\nSources: [...]" or a not-found message.
    """
    model_name = "sentence-transformers/all-mpnet-base-v2"
    model_kwargs = {"device": "cpu"}
    encode_kwargs = {"normalize_embeddings": False}
    embeddings = HuggingFaceEmbeddings(
        model_name=model_name,
        model_kwargs=model_kwargs,
        encode_kwargs=encode_kwargs,
    )

    db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embeddings)
    results = db.similarity_search_with_relevance_scores(query_text, k=3)
    if len(results) == 0:
        return "Unable to find matching results."

    context_text = "\n\n---\n\n".join([doc.page_content for doc, _score in results])
    context_pages = [doc.metadata.get("page", 0) for doc, _score in results]
    prompt_template = ChatPromptTemplate.from_template(PROMPT_TEMPLATE)
    prompt = prompt_template.format(context=context_text, question=query_text)

    model = ChatGoogleGenerativeAI(model="gemini-2.5-flash")
    response_text = model.invoke(prompt)

    # sources = [doc.metadata.get("source", None) for doc, _score in results]
    return {"response": response_text.content,
        "page_content": [doc.page_content for doc, _score in results],
        "pages": context_pages
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("query_text", type=str, help="The query text.")
    args = parser.parse_args()
    print(run_query(args.query_text))


if __name__ == "__main__":
    main()