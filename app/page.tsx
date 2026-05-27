'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ChatTab from '@/components/ChatTab';
import GenerateTab from '@/components/GenerateTab';
import BatchTab from '@/components/BatchTab';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type Tab = 'chat' | 'generate' | 'batch';

const TABS: { id: Tab; label: string }[] = [
  { id: 'chat', label: '💬 Ask the Spec' },
  { id: 'generate', label: '🧪 Generate Test Case' },
  { id: 'batch', label: '📦 Batch & Export' },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('chat');

  // Spec state
  const [chunks, setChunks] = useState<string[]>([]);
  const [specName, setSpecName] = useState('');
  const [specInfo, setSpecInfo] = useState('');
  const [specLoaded, setSpecLoaded] = useState(false);

  // Chat state
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [displayMessages, setDisplayMessages] = useState<Message[]>([]);

  // Generated test cases (shared between Generate and Batch tabs)
  const [generatedTCs, setGeneratedTCs] = useState<string[]>([]);

  const handleSpecLoaded = (
    name: string,
    loadedChunks: string[],
    info?: string
  ) => {
    setSpecName(name);
    setChunks(loadedChunks);
    setSpecLoaded(true);
    if (info) setSpecInfo(info);
    // Reset chat when a new spec is loaded
    setChatHistory([]);
    setDisplayMessages([]);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950">
      {/* Sidebar */}
      <Sidebar
        specLoaded={specLoaded}
        specName={specName}
        specInfo={specInfo}
        onSpecLoaded={(name, loadedChunks) => {
          // Fetch info from the upload response — handled inside Sidebar
          handleSpecLoaded(name, loadedChunks);
        }}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-4">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`text-sm font-medium py-1 px-1 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-400 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {specLoaded ? (
            <div className="flex items-center gap-2 text-xs text-green-400 bg-green-900/20
              border border-green-700/40 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              {specName}
            </div>
          ) : (
            <div className="text-xs text-gray-600 bg-gray-800/50 px-3 py-1.5 rounded-full">
              No spec loaded
            </div>
          )}
        </header>

        {/* Tab content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'chat' && (
            <ChatTab
              chunks={chunks}
              specName={specName}
              specLoaded={specLoaded}
              chatHistory={chatHistory}
              setChatHistory={setChatHistory}
              displayMessages={displayMessages}
              setDisplayMessages={setDisplayMessages}
            />
          )}
          {activeTab === 'generate' && (
            <GenerateTab
              chunks={chunks}
              specName={specName}
              specLoaded={specLoaded}
              onTestCaseGenerated={(tc) =>
                setGeneratedTCs((prev) => [...prev, tc])
              }
              totalCount={generatedTCs.length}
            />
          )}
          {activeTab === 'batch' && (
            <BatchTab
              chunks={chunks}
              specName={specName}
              specLoaded={specLoaded}
              generatedTCs={generatedTCs}
              setGeneratedTCs={setGeneratedTCs}
            />
          )}
        </div>
      </div>
    </div>
  );
}
