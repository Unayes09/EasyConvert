'use client';

import { useState } from 'react';
import axios from 'axios';
import FileUploader from '@/components/FileUploader';
import { Loader2, Download, AlertCircle, Merge, CheckCircle2 } from 'lucide-react';
import { parseAxiosError } from '@/utils/error-handler';

const API_GATEWAY = process.env.NEXT_PUBLIC_API_GATEWAY || 'http://localhost:8000';

export default function MergePdfsPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const startMerge = async () => {
    if (files.length < 2) {
      setError('Please select at least two PDF files to merge.');
      return;
    }

    setStatus('processing');
    setError(null);

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const response = await axios.post(`${API_GATEWAY}/pdf/merge-pdfs`, formData, {
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
        <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-100">
          <Merge className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Merge PDFs</h1>
          <p className="text-slate-500">Combine multiple PDF documents into a single professional file.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <FileUploader 
            onFilesSelected={setFiles} 
            accept=".pdf" 
            multiple={true}
            isLoading={status === 'processing'}
            title="Upload PDF Documents"
            description="Drag and drop multiple PDFs here in the order you want them merged"
          />

          {status === 'idle' && files.length >= 2 && (
            <button 
              onClick={startMerge}
              className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2"
            >
              <Merge className="w-5 h-5" />
              Merge {files.length} Documents
            </button>
          )}

          {status === 'processing' && (
            <div className="p-12 bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col items-center text-center gap-6">
              <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Merging Files...</h3>
                <p className="text-slate-500 max-w-sm">Combining your documents. This usually takes just a few seconds.</p>
              </div>
            </div>
          )}

          {status === 'completed' && resultUrl && (
            <div className="p-12 bg-white border border-emerald-100 rounded-3xl shadow-sm flex flex-col items-center text-center gap-6">
              <div className="p-5 bg-emerald-50 rounded-full">
                <CheckCircle2 className="w-16 h-16 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Merge Successful!</h3>
                <p className="text-slate-500 max-w-sm">Your new PDF has been generated and is ready for download.</p>
              </div>
              <a 
                href={resultUrl}
                download="merged.pdf"
                className="px-12 py-4 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 shadow-xl shadow-emerald-100 transition-all flex items-center gap-3"
              >
                <Download className="w-5 h-5" />
                Download Merged PDF
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
                <h4 className="font-bold mb-1">Merge Failed</h4>
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
          <div className="p-8 bg-indigo-900 text-white rounded-3xl shadow-xl">
            <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
              💡 Pro Tip
            </h4>
            <p className="text-sm text-indigo-200 leading-relaxed">
              Files are merged in the exact order they appear in your selection. You can re-order by removing and re-adding them in the desired sequence.
            </p>
          </div>
          <div className="p-8 bg-white border border-slate-200 rounded-3xl">
            <h4 className="font-bold text-slate-900 mb-4">Why Merge PDFs?</h4>
            <ul className="space-y-4 text-sm text-slate-600">
              <li>• Combine multiple reports into one.</li>
              <li>• Organize scanned documents.</li>
              <li>• Create a single portfolio file.</li>
              <li>• Better file sharing and management.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
