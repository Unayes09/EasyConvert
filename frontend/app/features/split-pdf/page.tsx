'use client';

import { useState } from 'react';
import axios from 'axios';
import FileUploader from '@/components/FileUploader';
import { Loader2, Download, AlertCircle, Scissors, CheckCircle2, FileText } from 'lucide-react';
import { parseAxiosError } from '@/utils/error-handler';

const API_GATEWAY = process.env.NEXT_PUBLIC_API_GATEWAY || 'http://localhost:8000';

export default function SplitPdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [ranges, setRanges] = useState("1-1");

  const startSplit = async () => {
    if (files.length === 0) return;

    setStatus('processing');
    setError(null);

    const formData = new FormData();
    formData.append('file', files[0]);
    
    try {
      const response = await axios.post(`${API_GATEWAY}/pdf/split-pdf?ranges=${ranges}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      setResultUrl(url);
      setStatus('completed');
    } catch (err: any) {
      const msg = await parseAxiosError(err);
      setError(msg);
      setStatus('failed');
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex items-center gap-6 pb-8 border-b border-slate-200">
        <div className="p-4 bg-purple-600 rounded-2xl shadow-lg shadow-purple-100">
          <Scissors className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Split PDF</h1>
          <p className="text-slate-500">Extract specific pages or ranges from your PDF documents.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <FileUploader 
            onFilesSelected={setFiles} 
            accept=".pdf" 
            isLoading={status === 'processing'}
            title="Upload PDF to Split"
            description="Extract pages into separate files"
          />

          {status === 'idle' && files.length > 0 && (
            <div className="flex flex-col gap-6 p-8 bg-white border border-slate-200 rounded-3xl shadow-sm">
              <div className="flex flex-col gap-4">
                <h4 className="font-bold text-slate-900">Define Page Ranges</h4>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Page Format</label>
                  <input 
                    type="text" 
                    value={ranges} 
                    onChange={(e) => setRanges(e.target.value)}
                    placeholder="e.g., 1-3, 5, 8-10"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                  <p className="text-xs text-slate-400">Use comma for separate parts and hyphen for ranges (1-based index).</p>
                </div>
              </div>
              <button 
                onClick={startSplit}
                className="w-full py-4 bg-purple-600 text-white font-bold rounded-2xl hover:bg-purple-700 shadow-xl shadow-purple-100 transition-all flex items-center justify-center gap-2"
              >
                <Scissors className="w-5 h-5" />
                Split PDF Pages
              </button>
            </div>
          )}

          {status === 'processing' && (
            <div className="p-12 bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col items-center text-center gap-6">
              <Loader2 className="w-16 h-16 text-purple-600 animate-spin" />
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Splitting Pages...</h3>
                <p className="text-slate-500 max-w-sm">Generating new PDF files for your requested ranges.</p>
              </div>
            </div>
          )}

          {status === 'completed' && resultUrl && (
            <div className="p-12 bg-white border border-emerald-100 rounded-3xl shadow-sm flex flex-col items-center text-center gap-6">
              <div className="p-5 bg-emerald-50 rounded-full">
                <CheckCircle2 className="w-16 h-16 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Split Complete!</h3>
                <p className="text-slate-500 max-w-sm">Your pages have been extracted. If you requested multiple ranges, they&apos;ve been bundled in a ZIP.</p>
              </div>
              <a 
                href={resultUrl}
                download={ranges.includes(',') || ranges.includes('-') && !ranges.match(/^\d+-\d+$/) ? "split_results.zip" : "extracted_pages.pdf"}
                className="px-12 py-4 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 shadow-xl shadow-emerald-100 transition-all flex items-center gap-3"
              >
                <Download className="w-5 h-5" />
                Download Results
              </a>
              <button 
                onClick={() => { setStatus('idle'); setFiles([]); setResultUrl(null); }}
                className="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600"
              >
                Start New Task
              </button>
            </div>
          )}

          {error && (
            <div className="p-6 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-4 text-red-700">
              <AlertCircle className="w-6 h-6 flex-shrink-0" />
              <div>
                <h4 className="font-bold mb-1">Split Failed</h4>
                <p className="text-sm opacity-90">{error}</p>
                <button 
                  onClick={() => { setStatus('idle'); setError(null); }}
                  className="mt-4 text-xs font-bold underline uppercase tracking-wider"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div className="p-8 bg-purple-900 text-white rounded-3xl shadow-xl">
            <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
              📖 Range Examples
            </h4>
            <ul className="space-y-4 text-sm text-purple-200">
              <li className="flex justify-between">
                <span>Single Page:</span>
                <span className="font-mono bg-purple-800 px-2 rounded">5</span>
              </li>
              <li className="flex justify-between">
                <span>Page Range:</span>
                <span className="font-mono bg-purple-800 px-2 rounded">1-10</span>
              </li>
              <li className="flex justify-between">
                <span>Mixed:</span>
                <span className="font-mono bg-purple-800 px-2 rounded">1-3, 7, 12-15</span>
              </li>
            </ul>
          </div>
          <div className="p-8 bg-white border border-slate-200 rounded-3xl">
            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              Why Split?
            </h4>
            <p className="text-sm text-slate-500 leading-relaxed">
              Splitting is perfect for extracting only the relevant chapters of a book, saving individual invoices from a batch, or reducing file size by removing unnecessary pages.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
