import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { findRelevantChunks } from '@/lib/rag';
import { buildQueryPrompt, SYSTEM_PROMPT } from '@/lib/prompts';

export const runtime = 'nodejs';
export const maxDuration = 30;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      query,
      chunks = [],
      history = [],
      specName = 'Uploaded Spec',
    }: {
      query: string;
      chunks: string[];
      history: Message[];
      specName: string;
    } = body;

    if (!query?.trim()) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    if (!chunks || chunks.length === 0) {
      return NextResponse.json({
        answer:
          '⚠️ No spec has been uploaded yet. Please upload a 3GPP PDF using the sidebar on the left.',
      });
    }

    const relevant = findRelevantChunks(query, chunks, 5);

    if (relevant.length === 0) {
      return NextResponse.json({
        answer:
          '⚠️ No relevant sections found for your query in the uploaded spec. Try using different technical terms or abbreviations.',
      });
    }

    const context = relevant.map((r) => r.chunk).join('\n\n---\n\n');
    const userPrompt = buildQueryPrompt(query, context, specName);

    // Keep last 6 messages (3 exchanges) for context window efficiency
    const trimmedHistory = history.slice(-6);

    const messages: Anthropic.Messages.MessageParam[] = [
      ...trimmedHistory,
      { role: 'user', content: userPrompt },
    ];

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages,
    });

    const answer =
      response.content[0].type === 'text' ? response.content[0].text : '';

    return NextResponse.json({ answer });
  } catch (err) {
    console.error('Chat error:', err);
    return NextResponse.json(
      { error: `Chat failed: ${String(err)}` },
      { status: 500 }
    );
  }
}
