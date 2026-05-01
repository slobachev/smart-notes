import type { NoteSource } from './types';

type AskStreamHandlers = {
  onMeta: (sources: NoteSource[]) => void;
  onDelta: (accumulatedText: string) => void;
};

/**
 * Reads NDJSON lines from POST /api/notes/ask (meta → delta* → done).
 */
export async function consumeAskNdjsonStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  { onMeta, onDelta }: AskStreamHandlers
): Promise<void> {
  const decoder = new TextDecoder();
  let buffer = '';
  let accumulated = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.trim()) continue;

      let msg: {
        type: string;
        sources?: NoteSource[];
        text?: string;
        message?: string;
      };

      try {
        msg = JSON.parse(line) as typeof msg;
      } catch {
        continue;
      }

      if (msg.type === 'meta' && msg.sources) {
        onMeta(msg.sources);
      }
      if (msg.type === 'delta' && msg.text) {
        accumulated += msg.text;
        onDelta(accumulated);
      }
      if (msg.type === 'error') {
        throw new Error(msg.message ?? 'Stream error');
      }
    }
  }
}
