'use client';

import { useState } from 'react';

interface BatchTabProps {
  chunks: string[];
  specName: string;
  specLoaded: boolean;
  generatedTCs: string[];
  setGeneratedTCs: React.Dispatch<React.SetStateAction<string[]>>;
}

function parseTestCaseToObj(raw: string): Record<string, string> {
  const fields = [
    'TEST CASE ID', 'TITLE', 'SPEC REFERENCE', 'OBJECTIVE',
    'CATEGORY', 'PRE-CONDITIONS', 'TEST STEPS', 'MEASUREMENT',
    'PASS CRITERIA', 'FAIL CRITERIA', 'NOTES',
  ];
  const result: Record<string, string> = {};
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];
    const next = fields[i + 1];
    const pattern = next
      ? new RegExp(`${field}\\s*:\\s*(.*?)(?=${next}\\s*:)`, 'si')
      : new RegExp(`${field}\\s*:\\s*(.*)$`, 'si');
    const match = raw.match(pattern);
    result[field] = match ? match[1].trim() : '';
  }
  return result;
}

function exportCSV(tcs: string[]): string {
  const rows = tcs.map(parseTestCaseToObj);
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const csvRows = [
    headers.map((h) => `"${h}"`).join(','),
    ...rows.map((row) =>
      headers.map((h) => `"${(row[h] || '').replace(/"/g, '""')}"`).join(',')
    ),
  ];
  return csvRows.join('\n');
}

function exportJSON(tcs: string[]): string {
  return JSON.stringify(tcs.map(parseTestCaseToObj), null, 2);
}

export default function BatchTab({
  chunks,
  specName,
  specLoaded,
  generatedTCs,
  setGeneratedTCs,
}: BatchTabProps) {
  const [batchInput, setBatchInput] = useState('');
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');

  const runBatch = async () => {
    const scenarios = batchInput
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    if (!scenarios.length || running) return;

    setRunning(true);
    setProgress(0);

    const newTCs: string[] = [];
    const startCount = generatedTCs.length;

    for (let i = 0; i < scenarios.length; i++) {
      setProgressLabel(`Generating ${i + 1}/${scenarios.length}: ${scenarios[i].slice(0, 50)}…`);

      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scenario: scenarios[i],
            chunks,
            specName,
            tcNumber: String(startCount + i + 1).padStart(3, '0'),
          }),
        });
        const data = await res.json();
        if (res.ok && data.testCase) {
          newTCs.push(data.testCase);
        }
      } catch {
        // continue on error
      }

      setProgress(((i + 1) / scenarios.length) * 100);
    }

    setGeneratedTCs((prev) => [...prev, ...newTCs]);
    setProgressLabel(`✅ Generated ${newTCs.length} test cases`);
    setRunning(false);
  };

  const downloadCSV = () => {
    const csv = exportCSV(generatedTCs);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'specbot_test_cases.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadJSON = () => {
    const json = exportJSON(generatedTCs);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'specbot_test_cases.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAllTXT = () => {
    const text = generatedTCs.join('\n\n' + '='.repeat(80) + '\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'specbot_test_cases.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left — Batch Input */}
      <div className="w-96 flex flex-col gap-4 p-6 border-r border-gray-800 overflow-y-auto shrink-0">
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">📦 Batch Generate</h2>
          <p className="text-xs text-gray-400">
            Enter one scenario per line — SpecBot generates all test cases automatically.
          </p>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-400 mb-2 block">
            Scenarios (one per line)
          </label>
          <textarea
            value={batchInput}
            onChange={(e) => setBatchInput(e.target.value)}
            rows={10}
            disabled={!specLoaded}
            placeholder={
              specLoaded
                ? 'Verify max output power FR1 band n77\nVerify receiver sensitivity 5G NR\nVerify EVM for 64QAM uplink NR\nVerify ACLR for NR UE FR1'
                : '⬅️ Upload a 3GPP PDF first'
            }
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm
              placeholder:text-gray-500 focus:outline-none focus:border-blue-500 resize-none font-mono
              disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="text-xs text-gray-600 mt-1">
            {batchInput.split('\n').filter(Boolean).length} scenarios
          </p>
        </div>

        <button
          onClick={runBatch}
          disabled={!specLoaded || running || !batchInput.trim()}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed
            text-white py-3 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
        >
          {running ? (
            <>
              <span className="animate-spin">⚙️</span>
              Running…
            </>
          ) : (
            '⚡ Generate All'
          )}
        </button>

        {/* Progress */}
        {running && (
          <div>
            <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400">{progressLabel}</p>
          </div>
        )}

        {progressLabel && !running && (
          <p className="text-xs text-green-400">{progressLabel}</p>
        )}

        {/* Stats */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-400 mb-2">Session Stats</p>
          <div className="text-2xl font-bold text-white">{generatedTCs.length}</div>
          <p className="text-xs text-gray-500">test cases generated</p>
        </div>
      </div>

      {/* Right — Export & Preview */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Export Toolbar */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-800">
          <span className="text-sm font-medium text-gray-300">📤 Export</span>
          <div className="flex gap-2 ml-auto">
            <button
              onClick={downloadCSV}
              disabled={generatedTCs.length === 0}
              className="text-xs bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed
                border border-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition-colors"
            >
              📊 CSV
            </button>
            <button
              onClick={downloadJSON}
              disabled={generatedTCs.length === 0}
              className="text-xs bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed
                border border-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition-colors"
            >
              📋 JSON
            </button>
            <button
              onClick={downloadAllTXT}
              disabled={generatedTCs.length === 0}
              className="text-xs bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed
                border border-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition-colors"
            >
              📄 TXT
            </button>
            <button
              onClick={() => setGeneratedTCs([])}
              disabled={generatedTCs.length === 0}
              className="text-xs bg-red-900/40 hover:bg-red-900/60 disabled:opacity-40 disabled:cursor-not-allowed
                border border-red-700/50 text-red-400 px-3 py-1.5 rounded-lg transition-colors"
            >
              🗑️ Clear All
            </button>
          </div>
        </div>

        {/* Test Case List */}
        <div className="flex-1 overflow-y-auto p-6">
          {generatedTCs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <div className="text-5xl mb-4">📦</div>
                <p className="text-gray-400 text-sm max-w-sm">
                  Generated test cases will appear here. Use the batch generator on the left
                  or generate individual test cases in the Generate tab.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {generatedTCs.map((tc, i) => {
                const titleMatch = tc.match(/TITLE\s*:\s*(.+)/);
                const title = titleMatch ? titleMatch[1].trim() : `Test Case #${i + 1}`;
                return (
                  <details
                    key={i}
                    className="bg-gray-900 border border-gray-700 rounded-xl group"
                  >
                    <summary className="flex items-center justify-between px-4 py-3 cursor-pointer
                      hover:bg-gray-800 rounded-xl list-none">
                      <div className="flex items-center gap-3">
                        <span className="text-xs bg-blue-900/50 text-blue-400 border border-blue-700/50
                          px-2 py-0.5 rounded-md font-mono">
                          #{i + 1}
                        </span>
                        <span className="text-sm text-gray-200 font-medium">{title}</span>
                      </div>
                      <span className="text-gray-500 text-xs group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div className="px-4 pb-4">
                      <pre className="text-xs text-gray-300 font-mono leading-relaxed whitespace-pre-wrap
                        bg-gray-950 rounded-lg p-4 border border-gray-800 mt-2">
                        {tc}
                      </pre>
                    </div>
                  </details>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
