"use client";

import { useContext, useState, useEffect } from "react";
import { UserIdContext } from '../components/UserProvider';
import Link from 'next/link';

export default function Home() {
  type FileInfo = {
    name: string;
    path: string;
    signedUrl?: string;
  };
  
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");
  const [uploaded, setUploaded] = useState<{ bucket: string; path: string } | null>(null);
  const [question, setQuestion] = useState<string>("");
  const [answer, setAnswer] = useState<string>("");
  const [sources, setSources] = useState<[]>([]);
  const [pageNums, setPageNums] = useState<[]>([]);
  const [showSources, setShowSources] = useState(false);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [isIndexing, setIsIndexing] = useState(false);

  const context = useContext(UserIdContext);
  if (!context) throw new Error('UserIdContext not found');
  const { userId, setUserId } = context;

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
      if (userId) {
        form.append("userId", userId);
      }
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
      setSelected(data.filename);
      setIsIndexing(true);
      await fetch(`${baseUrl}/rag/index`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucket: data.bucket, path: data.path }),
      });
      setIsIndexing(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setStatus(message);
      setIsIndexing(false);
    }
  };

  const onSelect = async (file: FileInfo) => {
    try {
      setSelected(file.name);
      setIsIndexing(true);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const res = await fetch(`${baseUrl}/rag/index`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucket: 'pdfs', path: file.path}),
      });
      if (!res.ok) {
        throw new Error(`Backend error: ${res.statusText}`);
      }
      const data = await res.json();
      console.log("RAG indexing successful:", data);
      setIsIndexing(false);
      setUploaded({bucket: "pdfs", path: file.path})
    } catch (err) {
      console.error("Error indexing file:", err);
      setIsIndexing(false);
      alert("Failed to index file");
    }
  }

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        const res = await fetch(`${baseUrl}/upload/getFiles`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
          }
        );
        const data = await res.json();
        console.log(data)
        console.log(typeof(data))
        setFiles(data ?? []);
        console.log(files[0]);
      } catch (err) {
        console.error("Error fetching files:", err);
      }
    }
    fetchFiles();
  }, [uploaded, userId]);

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
        <div>
          <h1 className="text-xl font-semibold mb-4">Your Uploaded Files</h1>
          {!userId && <div className="mb-4">
            <Link
              href="/login"
              className="text-blue-600 hover:underline"
            >
              Log in to view
            </Link>
          </div>}
          {userId && <div className="flex flex-col gap-2">
            {files.length === 0 && (
              <p className="text-gray-500">No files uploaded yet.</p>
            )}
            {files.length > 0 &&
            files
            .filter((file) => file.name !== ".emptyFolderPlaceholder")
            .map((file) => (
              <div
                key={file.name}
                onClick={() => onSelect(file)}
                className={`cursor-pointer p-3 rounded-md border transition ${
                  selected === file.name
                    ? isIndexing ? "bg-gray-400 border-gray-400"
                      : "bg-blue-100 border-blue-400"
                    : "bg-white border-gray-300 hover:bg-gray-100"
                }`}
              >
                <p className="font-medium text-black text-sm">{file.name}</p>
              </div>
            ))}
            {isIndexing && (
              <div className="flex items-center space-x-2 mt-3">
                <div className="animate-spin rounded-full h-5 w-5 border-4 border-blue-500 border-b-transparent" />
                <span>Indexing in progress...</span>
              </div>
            )}
            </div>}
          </div>
            
        {!isIndexing && uploaded && (
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
