import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { callAI } from '../aiClient';

// Mock import.meta.env
const mockEnv = {
  VITE_GROQ_API_KEY: undefined as string | undefined,
  VITE_OPENROUTER_API_KEY: undefined as string | undefined,
};

vi.stubGlobal('import', {
  meta: { env: mockEnv },
});

function mockFetchOk(content: string) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      choices: [{ message: { content } }],
    }),
  });
}

function mockFetchStatus(status: number) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: async () => ({}),
  });
}

describe('callAI', () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = { ...import.meta.env };

  beforeEach(() => {
    mockEnv.VITE_GROQ_API_KEY = undefined;
    mockEnv.VITE_OPENROUTER_API_KEY = undefined;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('throws when no API keys are configured', async () => {
    globalThis.fetch = mockFetchStatus(401);
    await expect(
      callAI([{ role: 'user', content: 'test' }]),
    ).rejects.toThrow('AI service temporarily unavailable');
  });

  it('returns groq provider on success', async () => {
    mockEnv.VITE_GROQ_API_KEY = 'test-groq-key';
    globalThis.fetch = mockFetchOk('response text');
    const result = await callAI([{ role: 'user', content: 'hello' }]);
    expect(result.provider).toBe('groq');
    expect(result.content).toBe('response text');
  });

  it('falls back to openrouter on Groq 429', async () => {
    mockEnv.VITE_GROQ_API_KEY = 'test-groq-key';
    mockEnv.VITE_OPENROUTER_API_KEY = 'test-openrouter-key';
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 429, json: async () => ({}) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'fallback' } }] }),
      });
    globalThis.fetch = fetchMock;
    const result = await callAI([{ role: 'user', content: 'hello' }]);
    expect(result.provider).toBe('openrouter');
    expect(result.content).toBe('fallback');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('throws when openrouter also fails', async () => {
    mockEnv.VITE_GROQ_API_KEY = 'test-groq-key';
    mockEnv.VITE_OPENROUTER_API_KEY = 'test-openrouter-key';
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({}) });
    await expect(
      callAI([{ role: 'user', content: 'hello' }]),
    ).rejects.toThrow('AI service temporarily unavailable');
  });
});
