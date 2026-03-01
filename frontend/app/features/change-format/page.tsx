'use client';

import { useState } from 'react';
import axios from 'axios';
import FileUploader from '@/components/FileUploader';
import { Loader2, Download, AlertCircle, FileType, CheckCircle2 } from 'lucide-react';
import { parseAxiosError } from '@/utils/error-handler';

const API_GATEWAY = process.env.NEXT_PUBLIC_API_GATEWAY || 'http://localhost:8000';

const formats = ['PNG', 'JPG', 'WEBP', 'PDF', 'ICO'];

export default function ChangeFormatPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [targetFormat, setTargetFormat] = useState('PNG');

  const startConversion = async () => {
    if (files.length === 0) return;

    setStatus('processing');
    setError(null);

    const formData = new FormData();
    formData.append('file', files[0]);
    
    try {
      const response = await axios.post(`${API_GATEWAY}/image/change-format?target_format=${targetFormat}`, formData, {
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
        <div className="p-4 bg-orange-600 rounded-2xl shadow-lg shadow-orange-100">
          <FileType className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Change Image Format</h1>
          <p className="text-slate-500">Quickly convert between different image formats like PNG, JPG, and WEBP.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <FileUploader 
            onFilesSelected={setFiles} 
            accept="image/*" 
            isLoading={status === 'processing'}
            title="Upload Image"
            description="Select the image you want to convert"
          />

          {status === 'idle' && files.length > 0 && (
            <div className="flex flex-col gap-6 p-8 bg-white border border-slate-200 rounded-3xl shadow-sm">
              <div className="flex flex-col gap-4">
                <h4 className="font-bold text-slate-900">Conversion Settings</h4>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select Target Format</label>
                  <div className="flex flex-wrap gap-2">
                    {formats.map((fmt) => (
                      <button 
                        key={fmt}
                        onClick={() => setTargetFormat(fmt)}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                          targetFormat === fmt 
                            ? 'bg-orange-600 text-white shadow-lg shadow-orange-100' 
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <button 
                onClick={startConversion}
                className="w-full py-4 bg-orange-600 text-white font-bold rounded-2xl hover:bg-orange-700 shadow-xl shadow-orange-100 transition-all flex items-center justify-center gap-2"
              >
                <FileType className="w-5 h-5" />
                Convert to {targetFormat}
              </button>
            </div>
          )}

          {status === 'processing' && (
            <div className="p-12 bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col items-center text-center gap-6">
              <Loader2 className="w-16 h-16 text-orange-600 animate-spin" />
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Converting Image...</h3>
                <p className="text-slate-500 max-w-sm">Re-encoding your image into the new format. This is usually instant.</p>
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
                <p className="text-slate-500 max-w-sm">Your new image has been generated and is ready for download.</p>
              </div>
              <a 
                href={resultUrl}
                download={`converted.${targetFormat.toLowerCase()}`}
                className="px-12 py-4 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 shadow-xl shadow-emerald-100 transition-all flex items-center gap-3"
              >
                <Download className="w-5 h-5" />
                Download Image
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
          <div className="p-8 bg-orange-900 text-white rounded-3xl shadow-xl">
            <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
              📸 Format Guide
            </h4>
            <ul className="space-y-4 text-sm text-orange-200">
              <li>• <span className="text-white font-bold">PNG:</span> Best for transparent backgrounds and lossless quality.</li>
              <li>• <span className="text-white font-bold">JPG:</span> Best for photos with smaller file sizes.</li>
              <li>• <span className="text-white font-bold">WEBP:</span> Modern web format for the best compression.</li>
              <li>• <span className="text-white font-bold">ICO:</span> Standard format for website favicons.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
