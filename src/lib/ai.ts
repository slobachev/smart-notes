import { openai } from './openai';

/** Chat model for tags and summaries (cheap, fast). */
export const AI_CHAT_MODEL = 'gpt-4o-mini';

/** Must match `vector(1536)` in Prisma / pgvector. */
export const AI_EMBEDDING_MODEL = 'text-embedding-3-small';
export const EMBEDDING_DIMENSIONS = 1536;

const MAX_EMBED_INPUT_CHARS = 12_000;
const MAX_RAG_CONTEXT_CHARS = 24_000;

function buildNoteBody(title: string, content: string): string {
  const t = title.trim();
  const c = content.trim();
  if (!t) return c;
  return `Title: ${t}\n\n${c}`;
}

function truncateForEmbedding(text: string): string {
  if (text.length <= MAX_EMBED_INPUT_CHARS) return text;
  return text.slice(0, MAX_EMBED_INPUT_CHARS);
}

/**
 * Parses model output like "tag1, tag2, tag3" into a clean unique list (max 8).
 */
export function parseTagsFromModelOutput(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(',')) {
    const tag = part.trim().replace(/^["']|["']$/g, '');
    if (!tag || tag.length > 48) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
    if (out.length >= 8) break;
  }
  return out;
}

/**
 * Returns 3–5 short tags for the note (any language the note uses).
 */
export async function generateTagsForNote(
  title: string,
  content: string
): Promise<string[]> {
  const body = buildNoteBody(title, content);
  if (!body) return [];

  const completion = await openai.chat.completions.create({
    model: AI_CHAT_MODEL,
    temperature: 0.3,
    messages: [
      {
        role: 'system',
        content:
          'You label notes with short topical tags. Reply with 3 to 5 tags only, separated by commas. ' +
          'No numbering, bullets, quotes, or extra text. Use the same language as the note when possible.',
      },
      {
        role: 'user',
        content: body,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? '';
  if (!raw) return [];
  return parseTagsFromModelOutput(raw);
}

/**
 * One or two sentences summarizing the note.
 */
export async function generateSummaryForNote(
  title: string,
  content: string
): Promise<string> {
  const body = buildNoteBody(title, content);
  if (!body) return '';

  const completion = await openai.chat.completions.create({
    model: AI_CHAT_MODEL,
    temperature: 0.3,
    messages: [
      {
        role: 'system',
        content:
          'Summarize the note in 1–2 clear sentences. Same language as the note. No preamble or markdown.',
      },
      {
        role: 'user',
        content: body,
      },
    ],
  });

  return (completion.choices[0]?.message?.content ?? '').trim();
}

/**
 * Embedding vector for semantic search (1536 dims for text-embedding-3-small default).
 */
export async function createEmbedding(text: string): Promise<number[]> {
  const input = truncateForEmbedding(text.trim());
  if (!input) {
    throw new Error('Embedding input is empty');
  }

  const res = await openai.embeddings.create({
    model: AI_EMBEDDING_MODEL,
    input,
  });

  const vec = res.data[0]?.embedding;
  if (!vec?.length) {
    throw new Error('OpenAI returned no embedding');
  }
  if (vec.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Expected ${EMBEDDING_DIMENSIONS} dimensions, got ${vec.length}. Update schema or model settings.`
    );
  }
  return vec;
}

/**
 * Embedding for a note (title + body), suitable for storing on the Note row.
 */
export async function embedNoteText(
  title: string,
  content: string
): Promise<number[]> {
  return createEmbedding(buildNoteBody(title, content));
}

/**
 * Literal for PostgreSQL `vector` casts in raw SQL, e.g. `'[1,2,3]'::vector`.
 */
export function embeddingToPgVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}

function buildRagContextBlock(
  notes: { id: string; title: string; content: string }[]
): string {
  const parts: string[] = [];
  let used = 0;
  for (const n of notes) {
    const block = `--- Note id=${n.id}\nTitle: ${n.title}\n${n.content.trim()}\n`;
    if (used + block.length > MAX_RAG_CONTEXT_CHARS) break;
    parts.push(block);
    used += block.length;
  }
  return parts.join('\n');
}
export type RagAnswerResult = {
  answer: string;
  citedNoteIds: string[];
};
/**
 * Answers using only the provided note excerpts. citedNoteIds = notes included in context.
 */
export async function answerQuestionFromNotes(
  question: string,
  notes: { id: string; title: string; content: string }[]
): Promise<RagAnswerResult> {
  const q = question.trim();
  if (!q) {
    return { answer: '', citedNoteIds: [] };
  }
  if (notes.length === 0) {
    return {
      answer:
        'There is no suitable context in your notes yet (or the notes do not have embeddings). Add some text or save the note again.',
      citedNoteIds: [],
    };
  }
  const context = buildRagContextBlock(notes);
  const citedNoteIds = notes.map((n) => n.id);
  const completion = await openai.chat.completions.create({
    model: AI_CHAT_MODEL,
    temperature: 0.2,
    messages: [
      {
        role: 'system',
        content:
          'You are a helpful assistant. Answer ONLY using the "Notes" context below. ' +
          'If the answer is not in the notes, say clearly that the notes do not contain enough information. ' +
          'Do not invent facts. Use the same language as the user question when possible.',
      },
      {
        role: 'user',
        content: `Notes:\n${context}\n\nQuestion: ${q}`,
      },
    ],
  });
  const answer =
    completion.choices[0]?.message?.content?.trim() ??
    'Was unable to generate an answer.';
  return { answer, citedNoteIds };
}
