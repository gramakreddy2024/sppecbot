'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

interface ChatTabProps {
  chunks: string[];
  specName: string;
  specLoaded: boolean;
  chatHistory: Message[];
  setChatHistory: React.Dispatch<React.SetStateAction<Message[]>>;
  displayMessages: Message[];
  setDisplayMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

const QUICK_QUESTIONS = [
  'What is the maximum output power for FR1 PC3 UE?',
  'What are the EVM requirements for 5G NR uplink?',
  'Minimum receiver sensitivity for NR FR1 UE?',
  'ACLR requirements for NR UE?',
  'What is the spurious emission limit?',
];

export default function ChatTab({
  chunks,
  specName,
  specLoaded,
  chatHistory,
  setChatHistory,
  displayMessages,
  setDisplayMessages,
}: ChatTabProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages]);

  const sendMessage = async (question?: string) => {
    const query = (question ?? input).trim();
    if (!query || loading) return;

    const userMsg: Message = { role: 'user', content: query };
    setDisplayMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, chunks, history: chatHistory, specName }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Chat failed');

      const assistantMsg: Message = { role: 'assistant', content: data.answer };
      setDisplayMessages((prev) => [...prev, assistantMsg]);
      setChatHistory((prev) => [
        ...prev,
        userMsg,
        assistantMsg,
      ]);
    } catch (err) {
      setDisplayMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `❌ Error: ${String(err)}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {displayMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4">
            <div className="text-5xl">💬</div>
            <div>
              <h2 className="text-xl font-semibold text-gray-200 mb-1">
                Ask the Spec
              </h2>
              <p className="text-gray-400 text-sm max-w-md">
                {specLoaded
                  ? `${specName} is loaded. Ask any technical question and SpecBot will answer from the spec.`
                  : 'Upload a 3GPP PDF from the sidebar to get started.'}
              </p>
            </div>

            {specLoaded && (
              <div className="mt-2 w-full max-w-lg">
                <p className="text-xs text-gray-500 mb-3">Quick questions:</p>
                <div className="flex flex-col gap-2">
                  {QUICK_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="text-left text-xs text-blue-400 bg-gray-800/60 border border-gray-700 hover:border-blue-500/50 hover:bg-gray-800 px-4 py-2.5 rounded-lg transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          displayMessages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm shrink-0 mt-0.5">
                  📡
                </div>
              )}
              <div
                className={`max-w-2xl rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-gray-800 text-gray-100 rounded-bl-none'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm shrink-0 mt-0.5">
                  👤
                </div>
              )}
            </div>
          ))
        )}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm shrink-0">
              📡
            </div>
            <div className="bg-gray-800 rounded-2xl rounded-bl-none px-4 py-3">
              <div className="flex gap-1.5 items-center">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Clear button */}
      {displayMessages.length > 0 && (
        <div className="px-6 pb-1 flex justify-end">
          <button
            onClick={() => {
              setDisplayMessages([]);
              setChatHistory([]);
            }}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            🗑️ Clear chat
          </button>
        </div>
      )}

      {/* Input bar */}
      <div className="border-t border-gray-800 p-4">
        <div className="flex gap-3 max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder={
              specLoaded
                ? 'Ask about the spec… e.g. Max output power for FR1 PC3?'
                : '⬅️ Upload a 3GPP PDF first'
            }
            disabled={!specLoaded || loading}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm
              placeholder:text-gray-500 focus:outline-none focus:border-blue-500
              disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!specLoaded || loading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed
              text-white px-5 py-3 rounded-xl font-medium text-sm transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
