'use client';

import { useState } from 'react';

interface GenerateTabProps {
  chunks: string[];
  specName: string;
  specLoaded: boolean;
  onTestCaseGenerated: (tc: string) => void;
  totalCount: number;
}

const TEMPLATES = [
  'Verify maximum output power for 5G NR FR1 PC3 UE in band n77',
  'Verify receiver sensitivity for NR UE in FR1',
  'Verify EVM for 64QAM uplink 5G NR FR1',
  'Verify ACLR for NR UE FR1',
  'Verify spurious emission limits for 5G NR UE',
  'Verify reference sensitivity LTE UE Category 1',
  'Verify in-band emission NR FR2',
  'Verify handover performance LTE to NR',
];

export default function GenerateTab({
  chunks,
  specName,
  specLoaded,
  onTestCaseGenerated,
  totalCount,
}: GenerateTabProps) {
  const [scenario, setScenario] = useState('');
  const [generating, setGenerating] = useState(false);
  const [testCase, setTestCase] = useState('');
  const [error, setError] = useState('');
  const [tcCount, setTcCount] = useState(1);

  const generate = async (scenarioText?: string) => {
    const s = (scenarioText ?? scenario).trim();
    if (!s || generating) return;

    setGenerating(true);
    setError('');
    setTestCase('');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: s,
          chunks,
          specName,
          tcNumber: String(tcCount).padStart(3, '0'),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');

      setTestCase(data.testCase);
      setTcCount((prev) => prev + 1);
      onTestCaseGenerated(data.testCase);
    } catch (err) {
      setError(String(err));
    } finally {
      setGenerating(false);
    }
  };

  const downloadTxt = () => {
    const blob = new Blob([testCase], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test_case_${String(tcCount - 1).padStart(3, '0')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left — Input */}
      <div className="w-96 flex flex-col gap-4 p-6 border-r border-gray-800 overflow-y-auto shrink-0">
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">🧪 Generate Test Case</h2>
          <p className="text-xs text-gray-400">
            Describe a test scenario — SpecBot builds a full structured test case from the spec.
          </p>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-400 mb-2 block">
            Test Scenario
          </label>
          <textarea
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            rows={5}
            disabled={!specLoaded}
            placeholder={
              specLoaded
                ? 'e.g. Verify maximum output power of 5G NR UE in FR1 band n77 with 100MHz channel bandwidth'
                : '⬅️ Upload a 3GPP PDF first'
            }
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm
              placeholder:text-gray-500 focus:outline-none focus:border-blue-500 resize-none
              disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <button
          onClick={() => generate()}
          disabled={!specLoaded || generating || !scenario.trim()}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed
            text-white py-3 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <span className="animate-spin">⚙️</span>
              Generating…
            </>
          ) : (
            '⚡ Generate Test Case'
          )}
        </button>

        {totalCount > 0 && (
          <div className="text-xs text-gray-500 text-center">
            {totalCount} test case{totalCount !== 1 ? 's' : ''} in session
          </div>
        )}

        {/* Templates */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Quick Templates
          </p>
          <div className="flex flex-col gap-1.5">
            {TEMPLATES.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setScenario(t);
                  generate(t);
                }}
                disabled={!specLoaded || generating}
                className="text-left text-xs text-blue-400 bg-gray-800/60 border border-gray-700
                  hover:border-blue-500/50 hover:bg-gray-800 px-3 py-2 rounded-lg transition-colors
                  disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Output */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-900/30 border border-red-700/50 rounded-xl">
            <p className="text-xs text-red-400">❌ {error}</p>
          </div>
        )}

        {testCase ? (
          <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-800">
              <span className="text-sm font-medium text-green-400">✅ Test case generated</span>
              <button
                onClick={downloadTxt}
                className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300
                  px-3 py-1.5 rounded-lg transition-colors"
              >
                ⬇️ Download .txt
              </button>
            </div>

            {/* Test case content */}
            <div className="flex-1 overflow-y-auto p-6">
              <pre className="text-xs text-gray-200 font-mono leading-relaxed whitespace-pre-wrap bg-gray-900 rounded-xl p-5 border border-gray-800">
                {testCase}
              </pre>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <div className="text-5xl mb-4">🧪</div>
              <p className="text-gray-400 text-sm max-w-sm">
                {specLoaded
                  ? 'Describe a test scenario on the left and click Generate.'
                  : 'Upload a 3GPP PDF to enable test case generation.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
