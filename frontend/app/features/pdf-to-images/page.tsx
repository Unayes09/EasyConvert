'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import FileUploader from '@/components/FileUploader';
import { Loader2, Download, AlertCircle, CheckCircle2, FileText, Zap } from 'lucide-react';
import { parseAxiosError } from '@/utils/error-handler';

const API_GATEWAY = process.env.NEXT_PUBLIC_API_GATEWAY || 'http://localhost:8000';

export default function PdfToImagesPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'pending' | 'processing' | 'completed' | 'failed'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [dpi, setDpi] = useState(300);

  const startConversion = async () => {
    if (files.length === 0) return;

    setStatus('pending');
    setError(null);

    const formData = new FormData();
    formData.append('file', files[0]);
    
    try {
      const response = await axios.post(`${API_GATEWAY}/pdf/convert-pdf-async?dpi=${dpi}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setTaskId(response.data.task_id);
    } catch (err: any) {
      const msg = await parseAxiosError(err);
      setError(msg);
      setStatus('failed');
    }
  };

  const checkStatus = useCallback(async () => {
    if (!taskId) return;

    try {
      const response = await axios.get(`${API_GATEWAY}/pdf/status/${taskId}`);
      const newStatus = response.data.status;
      setStatus(newStatus);
      
      if (newStatus === 'completed' || newStatus === 'failed') {
        // Stop polling logic is handled by useEffect dependency on status
      }
    } catch (err) {
      console.error('Error checking status:', err);
    }
  }, [taskId, API_GATEWAY]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (taskId && (status === 'pending' || status === 'processing')) {
      interval = setInterval(checkStatus, 3000);
    }
    return () => clearInterval(interval);
  }, [taskId, status, checkStatus]);

  const downloadResults = () => {
    if (!taskId && status === 'completed') {
      // If we already finished, we need the task_id to download
      // But in this simple implementation, we might lose it if we set it to null
      // Let's refine the state logic
    }
    // Better: use a separate state for the final download ID
  };

  return (
    <div className="space-y-12">
      <div className="flex items-center gap-6 pb-8 border-b border-slate-200">
        <div className="p-4 bg-blue-600 rounded-2xl shadow-lg shadow-blue-100">
          <FileText className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">PDF to Images</h1>
          <p className="text-slate-500">Convert PDF pages into high-quality PNG images asynchronously.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <FileUploader 
            onFilesSelected={setFiles} 
            accept=".pdf" 
            isLoading={status === 'pending' || status === 'processing'}
            title="Upload your PDF"
            description="We'll convert each page into a separate image"
          />

          {status === 'idle' && files.length > 0 && (
            <div className="flex flex-col gap-6 p-8 bg-white border border-slate-200 rounded-3xl shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Conversion Settings</h4>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Configure your output quality</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-slate-600">DPI:</span>
                  <select 
                    value={dpi} 
                    onChange={(e) => setDpi(Number(e.target.value))}
                    className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    <option value={72}>72 (Fastest)</option>
                    <option value={150}>150 (Medium)</option>
                    <option value={300}>300 (High Quality)</option>
                  </select>
                </div>
              </div>
              <button 
                onClick={startConversion}
                className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5 fill-current" />
                Start Async Conversion
              </button>
            </div>
          )}

          {(status === 'pending' || status === 'processing') && (
            <div className="p-12 bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col items-center text-center gap-6">
              <div className="relative">
                <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Processing Your File</h3>
                <p className="text-slate-500 max-w-sm">
                  Our workers are currently converting your PDF. This might take a few seconds depending on the file size.
                </p>
              </div>
              <div className="px-6 py-2 bg-blue-50 text-blue-700 text-sm font-bold rounded-full uppercase tracking-widest">
                Status: {status}
              </div>
            </div>
          )}

          {status === 'completed' && (
            <div className="p-12 bg-white border border-emerald-100 rounded-3xl shadow-sm flex flex-col items-center text-center gap-6">
              <div className="p-5 bg-emerald-50 rounded-full">
                <CheckCircle2 className="w-16 h-16 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Conversion Ready!</h3>
                <p className="text-slate-500 max-w-sm">
                  Your images have been bundled into a ZIP file and are ready for download.
                </p>
              </div>
              <a 
                href={`${API_GATEWAY}/pdf/download-images/${taskId || ''}`}
                className="px-12 py-4 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 shadow-xl shadow-emerald-100 transition-all flex items-center gap-3"
                onClick={() => {
                  // After download, the task is cleaned up on server
                  setTimeout(() => {
                    setStatus('idle');
                    setFiles([]);
                    setTaskId(null);
                  }, 2000);
                }}
              >
                <Download className="w-5 h-5" />
                Download ZIP
              </a>
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
          <div className="p-8 bg-slate-900 text-white rounded-3xl shadow-xl">
            <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-400" />
              How it works
            </h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li className="flex gap-3">
                <span className="text-blue-400 font-bold">01</span>
                Your file is securely uploaded to our staging gateway.
              </li>
              <li className="flex gap-3">
                <span className="text-blue-400 font-bold">02</span>
                A background worker is triggered via Celery & Redis.
              </li>
              <li className="flex gap-3">
                <span className="text-blue-400 font-bold">03</span>
                Each page is rendered as a high-resolution image.
              </li>
              <li className="flex gap-3">
                <span className="text-blue-400 font-bold">04</span>
                Once complete, you get a direct download link.
              </li>
            </ul>
          </div>

          <div className="p-8 bg-white border border-slate-200 rounded-3xl">
            <h4 className="font-bold text-slate-900 mb-4">Quality Guide</h4>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest">Web / Standard</p>
                <p className="text-sm text-slate-700 font-semibold">72 - 150 DPI</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl">
                <p className="text-xs font-bold text-blue-400 mb-1 uppercase tracking-widest">Print / Professional</p>
                <p className="text-sm text-blue-700 font-semibold">300+ DPI</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
