"use client";

import { use, useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");
  const [uploaded, setUploaded] = useState<{ bucket: string; path: string } | null>(null);
  const [question, setQuestion] = useState<string>("");
  const [answer, setAnswer] = useState<string>("");
  const [sources, setSources] = useState<[]>([]);
  const [pageNums, setPageNums] = useState<[]>([]);
  const [showSources, setShowSources] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setStatus("Please select a PDF file.");
      return;
    }
    try {
      setStatus("Uploading...");
      const form = new FormData();
      form.append("file", file);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const res = await fetch(`${baseUrl}/upload/pdf`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Upload failed");
      }
      const data = await res.json();
      setUploaded({ bucket: data.bucket, path: data.path });
      setStatus(`Uploaded: ${data.path || "success"}`);
      await fetch(`${baseUrl}/rag/index`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucket: data.bucket, path: data.path }),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setStatus(message);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-md space-y-4">
        <h1 className="text-xl font-semibold">Upload a PDF</h1>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-black file:px-4 file:py-2 file:text-white dark:file:bg-white dark:file:text-black"
        />
        <button
          type="submit"
          className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-black"
          disabled={!file}
        >
          Upload
        </button>
        {status && <p className="text-sm text-gray-600 dark:text-gray-300">{status}</p>}
        {uploaded && (
          <div className="mt-6 space-y-3">
            <h2 className="text-lg font-semibold ">Ask a question</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Type your question..."
                className="flex-1 rounded-md border px-3 py-2 text-sm"
              />
              <button
                type="button"
                className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-black"
                disabled={!question}
                onClick={async () => {
                  setAnswer("");
                  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
                  const res = await fetch(`${baseUrl}/rag/query`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ question }),
                  });
                  const data = await res.json();
                  setAnswer(data.output || "");
                  setSources(data.page_content);
                  setPageNums(data.pages);
                }}
              >
                Ask
              </button>
            </div>
            {answer && (
                <div className="mt-4 space-y-4">
                  <div>
                    <h3 className="text-md font-medium mb-2">Answer</h3>
                    <p className="whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-sm dark:bg-gray-900 dark:text-gray-100">
                      {answer}
                    </p>
                  </div>
                  {sources.length > 0 && (
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowSources(!showSources)}
                        className="flex items-center gap-2 text-md font-semibold mb-2 text-md"
                      >
                        Sources
                        <span className="text-sm">{showSources ? "▲" : "▼"}</span>
                      </button>

                      {showSources && (
                        <ul className="space-y-3 transition-all duration-300">
                          {sources.map((src, i) => (
                            <li
                              key={i}
                              className="rounded-md bg-gray-50 p-3 text-sm dark:bg-gray-900"
                            >
                              <p className="dark:text-gray-100 text-sm mb-1">
                                Page {pageNums[i] ?? "?"}
                              </p>
                              <p>{src}</p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            )}
      </form>
    </main>
  );
}
