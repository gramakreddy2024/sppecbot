import { NextRequest, NextResponse } from 'next/server';
import { chunkText } from '@/lib/rag';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Extract plain text from a PDF buffer using pdf2json.
 * pdf2json is a Node.js-native parser with no worker/DOM dependencies,
 * and handles modern PDF structures that pdf-parse (bundled pdfjs 2019) cannot.
 */
async function extractTextFromPDF(buffer: Buffer): Promise<{ text: string; numPages: number }> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const PDFParser = require('pdf2json');

  return new Promise((resolve, reject) => {
    const parser = new PDFParser(null, 1); // second arg = suppress verbosity

    parser.on('pdfParser_dataError', (err: { parserError: Error }) => {
      reject(err.parserError);
    });

    parser.on('pdfParser_dataReady', () => {
      // pdf2json stores text per page
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pages: any[] = parser.data?.Pages ?? [];
      const pageTexts = pages.map((page: any) =>
        (page.Texts ?? [])
          .map((t: any) =>
            (t.R ?? []).map((r: any) => decodeURIComponent(r.T ?? '')).join('')
          )
          .join(' ')
      );
      resolve({
        text: pageTexts.join('\n'),
        numPages: pages.length,
      });
    });

    parser.parseBuffer(buffer);
  });
}

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

    const { text, numPages } = await extractTextFromPDF(buffer);
    const chunks = chunkText(text);

    return NextResponse.json({
      success: true,
      fileName: file.name,
      totalPages: numPages,
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
