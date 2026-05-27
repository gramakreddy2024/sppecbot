export interface ChunkResult {
  chunk: string;
  score: number;
  index: number;
}

/**
 * Split text into overlapping chunks for RAG retrieval.
 * Uses sentence-aware splitting to avoid cutting mid-sentence.
 */
export function chunkText(text: string, chunkSize = 1000, overlap = 200): string[] {
  // Clean up PDF extraction artifacts
  const cleaned = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

  const chunks: string[] = [];
  let start = 0;

  while (start < cleaned.length) {
    let end = start + chunkSize;

    // Try to end at a sentence boundary
    if (end < cleaned.length) {
      const nearEnd = cleaned.lastIndexOf('.', end);
      if (nearEnd > start + chunkSize / 2) {
        end = nearEnd + 1;
      }
    }

    end = Math.min(end, cleaned.length);
    const chunk = cleaned.slice(start, end).trim();

    if (chunk.length > 50) {
      chunks.push(chunk);
    }

    // If we've consumed to the end of the text, stop.
    // Without this check, start = end - overlap stays < cleaned.length
    // forever, causing an infinite loop and array overflow.
    if (end >= cleaned.length) break;

    start = end - overlap;
    // Ensure forward progress in case overlap >= chunkSize
    if (start <= 0 || start >= cleaned.length) break;
  }

  return chunks;
}

/**
 * Tokenize text into searchable terms.
 * Preserves technical terms like "FR1", "n77", "EVM", "3GPP".
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s.-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

/**
 * BM25-inspired keyword search over chunks.
 * Works well for 3GPP specs with unique technical terms.
 */
export function findRelevantChunks(
  query: string,
  chunks: string[],
  topK = 5
): ChunkResult[] {
  const queryTokens = tokenize(query);
  const querySet = new Set(queryTokens);

  const scored = chunks.map((chunk, index) => {
    const chunkLower = chunk.toLowerCase();
    const chunkTokens = tokenize(chunk);
    const chunkTokenCounts = new Map<string, number>();

    for (const t of chunkTokens) {
      chunkTokenCounts.set(t, (chunkTokenCounts.get(t) || 0) + 1);
    }

    let score = 0;

    for (const qt of queryTokens) {
      // Exact token match (weighted by frequency)
      const count = chunkTokenCounts.get(qt) || 0;
      if (count > 0) {
        score += Math.log(1 + count) * 2;
      }

      // Substring match for technical terms (e.g. "fr1" matches "fr1-ue")
      if (qt.length > 3) {
        for (const [ct, cnt] of chunkTokenCounts.entries()) {
          if (ct !== qt && ct.includes(qt)) {
            score += 0.4 * cnt;
          }
        }
      }
    }

    // Bonus: coverage (how many unique query terms appear)
    const coveredCount = queryTokens.filter((qt) => chunkLower.includes(qt)).length;
    const coverage = coveredCount / Math.max(queryTokens.length, 1);
    score *= 1 + coverage * 0.5;

    return { chunk, score, index };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .filter((r) => r.score > 0);
}
