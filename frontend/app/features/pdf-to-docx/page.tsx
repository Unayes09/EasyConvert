'use client';

import { useState } from 'react';
import axios from 'axios';
import FileUploader from '@/components/FileUploader';
import { Loader2, Download, AlertCircle, FileType, CheckCircle2 } from 'lucide-react';
import { parseAxiosError } from '@/utils/error-handler';

const API_GATEWAY = process.env.NEXT_PUBLIC_API_GATEWAY || 'http://localhost:8000';

export default function PdfToDocxPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const startConversion = async () => {
    if (files.length === 0) return;

    setStatus('processing');
    setError(null);

    const formData = new FormData();
    formData.append('file', files[0]);
    
    try {
      const response = await axios.post(`${API_GATEWAY}/pdf/pdf-to-docx`, formData, {
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
        <div className="p-4 bg-sky-600 rounded-2xl shadow-lg shadow-sky-100">
          <FileType className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">PDF to Word</h1>
          <p className="text-slate-500">Convert your PDF documents into editable Word files (.docx).</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <FileUploader 
            onFilesSelected={setFiles} 
            accept=".pdf" 
            isLoading={status === 'processing'}
            title="Upload PDF to Convert"
            description="Transform your document into Word format"
          />

          {status === 'idle' && files.length > 0 && (
            <button 
              onClick={startConversion}
              className="w-full py-4 bg-sky-600 text-white font-bold rounded-2xl hover:bg-sky-700 shadow-xl shadow-sky-100 transition-all flex items-center justify-center gap-2"
            >
              <FileType className="w-5 h-5" />
              Convert to DOCX
            </button>
          )}

          {status === 'processing' && (
            <div className="p-12 bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col items-center text-center gap-6">
              <Loader2 className="w-16 h-16 text-sky-600 animate-spin" />
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Converting Document...</h3>
                <p className="text-slate-500 max-w-sm">Reconstructing your PDF structure into Word format. This can take a moment for large files.</p>
              </div>
            </div>
          )}

          {status === 'completed' && resultUrl && (
            <div className="p-12 bg-white border border-emerald-100 rounded-3xl shadow-sm flex flex-col items-center text-center gap-6">
              <div className="p-5 bg-emerald-50 rounded-full">
                <CheckCircle2 className="w-16 h-16 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Conversion Ready!</h3>
                <p className="text-slate-500 max-w-sm">Your Word document has been generated and is ready for download.</p>
              </div>
              <a 
                href={resultUrl}
                download={files[0].name.replace('.pdf', '.docx')}
                className="px-12 py-4 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 shadow-xl shadow-emerald-100 transition-all flex items-center gap-3"
              >
                <Download className="w-5 h-5" />
                Download Word File
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
                <h4 className="font-bold mb-1">Conversion Failed</h4>
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
          <div className="p-8 bg-sky-900 text-white rounded-3xl shadow-xl">
            <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
              📝 Editable Layout
            </h4>
            <p className="text-sm text-sky-200 leading-relaxed">
              Our conversion process tries to maintain text, formatting, and images so you can edit the document easily in Microsoft Word.
            </p>
          </div>
          <div className="p-8 bg-white border border-slate-200 rounded-3xl">
            <h4 className="font-bold text-slate-900 mb-4">Tips for Best Results</h4>
            <ul className="space-y-4 text-sm text-slate-600">
              <li>• Works best with text-heavy PDFs.</li>
              <li>• Preserves most font styles.</li>
              <li>• Layout may vary for complex graphics.</li>
              <li>• Faster for smaller documents.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
