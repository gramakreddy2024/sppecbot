import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { findRelevantChunks } from '@/lib/rag';
import { buildTestCasePrompt, SYSTEM_PROMPT } from '@/lib/prompts';

export const runtime = 'nodejs';
export const maxDuration = 60;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      scenario,
      chunks = [],
      specName = 'Uploaded Spec',
      tcNumber = '001',
    }: {
      scenario: string;
      chunks: string[];
      specName: string;
      tcNumber: string;
    } = body;

    if (!scenario?.trim()) {
      return NextResponse.json(
        { error: 'Scenario description is required' },
        { status: 400 }
      );
    }

    if (!chunks || chunks.length === 0) {
      return NextResponse.json({
        testCase:
          '⚠️ No spec has been uploaded yet. Please upload a 3GPP PDF using the sidebar on the left.',
      });
    }

    const relevant = findRelevantChunks(scenario, chunks, 6);

    // Fall back to first few chunks if no relevant match found
    const context =
      relevant.length > 0
        ? relevant.map((r) => r.chunk).join('\n\n---\n\n')
        : chunks.slice(0, 4).join('\n\n---\n\n');

    // Build a clean spec ID for the test case
    const specShort = specName
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .slice(0, 15)
      .toUpperCase();
    const tcId = `TC_${specShort}_${tcNumber}`;

    const userPrompt = buildTestCasePrompt(scenario, context, specName, tcId);

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const testCase =
      response.content[0].type === 'text' ? response.content[0].text : '';

    return NextResponse.json({ testCase });
  } catch (err) {
    console.error('Generate error:', err);
    return NextResponse.json(
      { error: `Generation failed: ${String(err)}` },
      { status: 500 }
    );
  }
}
