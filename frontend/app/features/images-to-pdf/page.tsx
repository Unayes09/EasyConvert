'use client';

import { useState } from 'react';
import axios from 'axios';
import FileUploader from '@/components/FileUploader';
import { Loader2, Download, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { parseAxiosError } from '@/utils/error-handler';

const API_GATEWAY = process.env.NEXT_PUBLIC_API_GATEWAY || 'http://localhost:8000';

export default function ImagesToPdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const startConversion = async () => {
    if (files.length === 0) return;

    setStatus('processing');
    setError(null);

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const response = await axios.post(`${API_GATEWAY}/image/images-to-pdf`, formData, {
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
        <div className="p-4 bg-red-600 rounded-2xl shadow-lg shadow-red-100">
          <FileText className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Images to PDF</h1>
          <p className="text-slate-500">Combine multiple images into a single professional PDF document.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <FileUploader 
            onFilesSelected={setFiles} 
            accept="image/*" 
            multiple={true}
            isLoading={status === 'processing'}
            title="Upload Images"
            description="Drag and drop your images to be combined into a PDF"
          />

          {status === 'idle' && files.length > 0 && (
            <button 
              onClick={startConversion}
              className="w-full py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 shadow-xl shadow-red-100 transition-all flex items-center justify-center gap-2"
            >
              <FileText className="w-5 h-5" />
              Generate PDF from {files.length} Images
            </button>
          )}

          {status === 'processing' && (
            <div className="p-12 bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col items-center text-center gap-6">
              <Loader2 className="w-16 h-16 text-red-600 animate-spin" />
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Generating PDF...</h3>
                <p className="text-slate-500 max-w-sm">Combining your images into a single document. This is usually instant.</p>
              </div>
            </div>
          )}

          {status === 'completed' && resultUrl && (
            <div className="p-12 bg-white border border-emerald-100 rounded-3xl shadow-sm flex flex-col items-center text-center gap-6">
              <div className="p-5 bg-emerald-50 rounded-full">
                <CheckCircle2 className="w-16 h-16 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">PDF Generated!</h3>
                <p className="text-slate-500 max-w-sm">Your new PDF has been generated and is ready for download.</p>
              </div>
              <a 
                href={resultUrl}
                download="images_combined.pdf"
                className="px-12 py-4 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 shadow-xl shadow-emerald-100 transition-all flex items-center gap-3"
              >
                <Download className="w-5 h-5" />
                Download PDF
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
                <h4 className="font-bold mb-1">Generation Failed</h4>
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
          <div className="p-8 bg-red-900 text-white rounded-3xl shadow-xl">
            <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
              💡 Tip
            </h4>
            <p className="text-sm text-red-200 leading-relaxed">
              Combine your receipts, IDs, or photos into a single PDF document for easy sharing and printing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
