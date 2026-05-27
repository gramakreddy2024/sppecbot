'use client';

import { useState, useRef } from 'react';

interface SidebarProps {
  specLoaded: boolean;
  specName: string;
  specInfo: string;
  onSpecLoaded: (name: string, chunks: string[]) => void;
}

export default function Sidebar({
  specLoaded,
  specName,
  specInfo,
  onSpecLoaded,
}: SidebarProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file.');
      return;
    }

    setUploading(true);
    setError('');
    setUploadStatus('Parsing PDF…');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setUploadStatus(`${data.totalChunks} chunks · ${data.totalPages} pages`);
      onSpecLoaded(data.fileName, data.chunks);
    } catch (err) {
      setError(String(err));
      setUploadStatus('');
    } finally {
      setUploading(false);
    }
  };

  return (
    <aside className="w-64 min-h-screen bg-gray-900 border-r border-gray-800 flex flex-col p-4 gap-5 shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-3 pt-2">
        <span className="text-3xl">📡</span>
        <div>
          <h1 className="font-bold text-white text-lg leading-tight">SpecBot</h1>
          <p className="text-xs text-blue-400">3GPP AI Test Assistant</p>
        </div>
      </div>

      <div className="border-t border-gray-700" />

      {/* Upload */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          📂 Upload Spec
        </p>

        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
          }}
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer select-none
            ${dragOver ? 'border-blue-400 bg-blue-900/20' : ''}
            ${uploading ? 'border-blue-500 bg-blue-900/10 cursor-wait' : ''}
            ${!uploading && !dragOver ? 'border-gray-600 hover:border-blue-500 hover:bg-gray-800/50' : ''}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />

          {uploading ? (
            <div>
              <div className="text-2xl mb-2 animate-pulse">⚙️</div>
              <p className="text-xs text-blue-400 font-medium">{uploadStatus}</p>
            </div>
          ) : specLoaded ? (
            <div>
              <div className="text-2xl mb-1">🔄</div>
              <p className="text-xs text-gray-400">Upload another spec</p>
            </div>
          ) : (
            <div>
              <div className="text-2xl mb-1">📄</div>
              <p className="text-xs text-gray-300 font-medium">Drop 3GPP PDF</p>
              <p className="text-xs text-gray-500 mt-1">or click to browse</p>
              <p className="text-xs text-gray-600 mt-2">Max 30 MB</p>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-2 p-2 bg-red-900/30 border border-red-700/50 rounded-lg">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {specLoaded && !uploading && (
          <div className="mt-3 p-3 bg-green-900/20 border border-green-700/40 rounded-xl">
            <p className="text-xs text-green-400 font-semibold mb-1">✅ Spec Ready</p>
            <p className="text-xs text-gray-300 truncate">{specName}</p>
            {specInfo && (
              <p className="text-xs text-gray-500 mt-1">{specInfo}</p>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-gray-700" />

      {/* Instruments */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          🔬 Instruments
        </p>
        <div className="space-y-2 text-xs text-gray-400">
          <div className="flex gap-2">
            <span className="text-blue-400 font-semibold w-14 shrink-0">R&S</span>
            <span>CMW, CMX, FSW, SMW</span>
          </div>
          <div className="flex gap-2">
            <span className="text-blue-400 font-semibold w-14 shrink-0">Keysight</span>
            <span>UXM, PXA, MXA</span>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-700" />

      {/* Standards tags */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          📋 Standards
        </p>
        <div className="flex flex-wrap gap-1.5">
          {['LTE', '5G NR', '6G', '3GPP TS', '3GPP TR'].map((tag) => (
            <span
              key={tag}
              className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-md border border-gray-700"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto border-t border-gray-700 pt-4">
        <p className="text-xs text-gray-600 text-center">Built for RF Test Engineers</p>
        <p className="text-xs text-gray-700 text-center mt-1">v1.0.0</p>
      </div>
    </aside>
  );
}
