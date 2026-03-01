'use client';

import { useState } from 'react';
import axios from 'axios';
import FileUploader from '@/components/FileUploader';
import { Loader2, Download, AlertCircle, PlusSquare, CheckCircle2, Image as ImageIcon, FileText } from 'lucide-react';
import { parseAxiosError } from '@/utils/error-handler';

const API_GATEWAY = process.env.NEXT_PUBLIC_API_GATEWAY || 'http://localhost:8000';

export default function InsertImagePage() {
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [splitIndex, setSplitIndex] = useState(0);

  const startInserting = async () => {
    if (pdfFiles.length === 0 || imageFiles.length === 0) {
      setError('Please select both a PDF file and an image file.');
      return;
    }

    setStatus('processing');
    setError(null);

    const formData = new FormData();
    formData.append('pdf_file', pdfFiles[0]);
    formData.append('image_file', imageFiles[0]);
    
    try {
      const response = await axios.post(`${API_GATEWAY}/pdf/insert-image?split_index=${splitIndex}`, formData, {
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
        <div className="p-4 bg-cyan-600 rounded-2xl shadow-lg shadow-cyan-100">
          <PlusSquare className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Insert Image</h1>
          <p className="text-slate-500">Insert an image as a new page into an existing PDF document.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FileUploader 
              onFilesSelected={setPdfFiles} 
              accept=".pdf" 
              isLoading={status === 'processing'}
              title="Step 1: Upload PDF"
              description="The source document"
            />
            <FileUploader 
              onFilesSelected={setImageFiles} 
              accept=".png,.jpg,.jpeg" 
              isLoading={status === 'processing'}
              title="Step 2: Upload Image"
              description="New page to insert"
            />
          </div>

          {status === 'idle' && pdfFiles.length > 0 && imageFiles.length > 0 && (
            <div className="flex flex-col gap-6 p-8 bg-white border border-slate-200 rounded-3xl shadow-sm">
              <div className="flex flex-col gap-4">
                <h4 className="font-bold text-slate-900">Placement Settings</h4>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Insert after page index</label>
                  <input 
                    type="number" 
                    value={splitIndex} 
                    onChange={(e) => setSplitIndex(Number(e.target.value))}
                    min={0}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                  />
                  <p className="text-xs text-slate-400">0 means insert at the very beginning. Indices are 0-based.</p>
                </div>
              </div>
              <button 
                onClick={startInserting}
                className="w-full py-4 bg-cyan-600 text-white font-bold rounded-2xl hover:bg-cyan-700 shadow-xl shadow-cyan-100 transition-all flex items-center justify-center gap-2"
              >
                <PlusSquare className="w-5 h-5" />
                Insert Image into PDF
              </button>
            </div>
          )}

          {status === 'processing' && (
            <div className="p-12 bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col items-center text-center gap-6">
              <Loader2 className="w-16 h-16 text-cyan-600 animate-spin" />
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Generating Modified PDF...</h3>
                <p className="text-slate-500 max-w-sm">Inserting your image and matching the page size.</p>
              </div>
            </div>
          )}

          {status === 'completed' && resultUrl && (
            <div className="p-12 bg-white border border-emerald-100 rounded-3xl shadow-sm flex flex-col items-center text-center gap-6">
              <div className="p-5 bg-emerald-50 rounded-full">
                <CheckCircle2 className="w-16 h-16 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Modified Successfully!</h3>
                <p className="text-slate-500 max-w-sm">Your image has been inserted as a new page in the PDF.</p>
              </div>
              <a 
                href={resultUrl}
                download="modified_document.pdf"
                className="px-12 py-4 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 shadow-xl shadow-emerald-100 transition-all flex items-center gap-3"
              >
                <Download className="w-5 h-5" />
                Download Modified PDF
              </a>
              <button 
                onClick={() => { setStatus('idle'); setPdfFiles([]); setImageFiles([]); setResultUrl(null); }}
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
                <h4 className="font-bold mb-1">Insertion Failed</h4>
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
          <div className="p-8 bg-cyan-900 text-white rounded-3xl shadow-xl">
            <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
              📐 Smart Scaling
            </h4>
            <p className="text-sm text-cyan-200 leading-relaxed">
              Our tool automatically detects the page size of your PDF and creates a matching new page for your image, centering it perfectly.
            </p>
          </div>
          <div className="p-8 bg-white border border-slate-200 rounded-3xl">
            <h4 className="font-bold text-slate-900 mb-4">Supported Formats</h4>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-600">PDF</span>
              <span className="px-3 py-1 bg-blue-100 rounded-lg text-xs font-bold text-blue-600">PNG</span>
              <span className="px-3 py-1 bg-orange-100 rounded-lg text-xs font-bold text-orange-600">JPG</span>
              <span className="px-3 py-1 bg-emerald-100 rounded-lg text-xs font-bold text-emerald-600">JPEG</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
