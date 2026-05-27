import { NextRequest, NextResponse } from 'next/server';
import { chunkText } from '@/lib/rag';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 });
    }

    // 30MB max
    if (file.size > 30 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 30MB.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Dynamic import to avoid webpack client-side bundling issues
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse');
    const pdfData = await pdfParse(buffer, {
      // Limit pages to avoid timeout on massive specs
      max: 200,
    });

    const chunks = chunkText(pdfData.text);

    return NextResponse.json({
      success: true,
      fileName: file.name,
      totalPages: pdfData.numpages,
      totalChunks: chunks.length,
      chunks,
    });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json(
      { error: `Failed to parse PDF: ${String(err)}` },
      { status: 500 }
    );
  }
}
