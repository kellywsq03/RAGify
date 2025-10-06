import { Injectable, InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class RagService {
  private pythonApiBaseUrl = process.env.PY_API_URL ?? 'http://localhost:8000';

  async indexFromSupabase(bucket: string, path: string) {
    try {
      const res = await fetch(`${this.pythonApiBaseUrl}/index`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bucket, path }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Index request failed');
      }
      const data: unknown = await res.json();
      const output = getStringField(data, 'output') ?? 'indexed';
      return { ok: true, output };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Indexing failed';
      throw new InternalServerErrorException(message);
    }
  }

  async query(question: string) {
    try {
      const res = await fetch(`${this.pythonApiBaseUrl}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Query request failed');
      }
      type QueryResponse = {
        response: string;
        page_content: string[];
        pages: number[];
      };
      const data = (await res.json()) as QueryResponse;
      return {
        ok: true,
        output: data.response,
        page_content: data.page_content,
        pages: data.pages,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Query failed';
      throw new InternalServerErrorException(message);
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getStringField(obj: unknown, key: string): string | undefined {
  if (!isRecord(obj)) return undefined;
  const value = obj[key];
  return typeof value === 'string' ? value : undefined;
}
