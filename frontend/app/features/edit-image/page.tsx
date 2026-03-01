'use client';

import { useState } from 'react';
import axios from 'axios';
import FileUploader from '@/components/FileUploader';
import { Loader2, Download, AlertCircle, Settings, CheckCircle2, RotateCcw } from 'lucide-react';
import { parseAxiosError } from '@/utils/error-handler';

const API_GATEWAY = process.env.NEXT_PUBLIC_API_GATEWAY || 'http://localhost:8000';

export default function EditImagePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Settings
  const [brightness, setBrightness] = useState(1.0);
  const [contrast, setContrast] = useState(1.0);
  const [sharpness, setSharpness] = useState(1.0);
  const [grayscale, setGrayscale] = useState(false);
  const [rotate, setRotate] = useState(0);

  const handleFilesSelected = (selectedFiles: File[]) => {
    setFiles(selectedFiles);
    if (selectedFiles.length > 0) {
      const url = URL.createObjectURL(selectedFiles[0]);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const resetSettings = () => {
    setBrightness(1.0);
    setContrast(1.0);
    setSharpness(1.0);
    setGrayscale(false);
    setRotate(0);
  };

  const startEditing = async () => {
    if (files.length === 0) return;

    setStatus('processing');
    setError(null);

    const formData = new FormData();
    formData.append('file', files[0]);
    
    const params = new URLSearchParams({
      brightness: brightness.toString(),
      contrast: contrast.toString(),
      sharpness: sharpness.toString(),
      grayscale: grayscale.toString(),
      rotate: rotate.toString()
    });

    try {
      const response = await axios.post(`${API_GATEWAY}/image/edit-image?${params.toString()}`, formData, {
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
        <div className="p-4 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-100">
          <Settings className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Edit Image</h1>
          <p className="text-slate-500">Fine-tune your images with brightness, contrast, and other professional adjustments.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <FileUploader 
            onFilesSelected={handleFilesSelected} 
            accept="image/*" 
            isLoading={status === 'processing'}
            title="Upload Image"
            description="Select the image you want to edit"
          />

          {status === 'idle' && files.length > 0 && previewUrl && (
            <div className="flex flex-col gap-8">
              {/* Preview Box */}
              <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col items-center gap-4">
                <div className="flex items-center justify-between w-full border-b border-slate-100 pb-4 mb-2">
                  <h4 className="font-bold text-slate-900">Live Preview</h4>
                  <span className="text-xs text-slate-400 font-medium italic">Approximation of final result</span>
                </div>
                <div className="relative w-full max-h-[500px] flex items-center justify-center overflow-hidden rounded-xl bg-slate-50 border border-slate-100 p-4">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="max-w-full max-h-[400px] object-contain shadow-md transition-all duration-200"
                    style={{
                      filter: `brightness(${brightness}) contrast(${contrast}) grayscale(${grayscale ? 100 : 0}%)`,
                      transform: `rotate(${rotate}deg)`,
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-8 p-8 bg-white border border-slate-200 rounded-3xl shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h4 className="font-bold text-slate-900">Adjustments</h4>
                <button 
                  onClick={resetSettings}
                  className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                <Slider label="Brightness" value={brightness} min={0} max={2} step={0.1} onChange={setBrightness} />
                <Slider label="Contrast" value={contrast} min={0} max={2} step={0.1} onChange={setContrast} />
                <Slider label="Sharpness" value={sharpness} min={0} max={2} step={0.1} onChange={setSharpness} />
                <Slider label="Rotation" value={rotate} min={0} max={360} step={90} unit="°" onChange={setRotate} />
                
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                  <span className="text-sm font-bold text-slate-700">Grayscale Mode</span>
                  <button 
                    onClick={() => setGrayscale(!grayscale)}
                    className={`w-12 h-6 rounded-full transition-all relative ${grayscale ? 'bg-blue-600' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${grayscale ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              </div>

              <button 
                onClick={startEditing}
                className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all flex items-center justify-center gap-2"
              >
                <Settings className="w-5 h-5" />
                Apply Adjustments
              </button>
            </div>
          </div>
          )}

          {status === 'processing' && (
            <div className="p-12 bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col items-center text-center gap-6">
              <Loader2 className="w-16 h-16 text-emerald-600 animate-spin" />
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Editing Your Image...</h3>
                <p className="text-slate-500 max-w-sm">Applying filters and re-processing pixels. This is usually instant.</p>
              </div>
            </div>
          )}

          {status === 'completed' && resultUrl && (
            <div className="p-12 bg-white border border-emerald-100 rounded-3xl shadow-sm flex flex-col items-center text-center gap-6">
              <div className="p-5 bg-emerald-50 rounded-full">
                <CheckCircle2 className="w-16 h-16 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Image Updated!</h3>
                <p className="text-slate-500 max-w-sm">Your adjustments have been applied. Download your edited image below.</p>
              </div>
              <a 
                href={resultUrl}
                download="edited_image.png"
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
                <h4 className="font-bold mb-1">Edit Failed</h4>
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
          <div className="p-8 bg-emerald-900 text-white rounded-3xl shadow-xl">
            <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
              📊 Adjustments Info
            </h4>
            <p className="text-sm text-emerald-200 leading-relaxed">
              1.0 is the default value for all sliders. Values below 1.0 decrease the effect, while values above 1.0 increase it.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, step, unit = "x", onChange }: { label: string, value: number, min: number, max: number, step: number, unit?: string, onChange: (v: number) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-slate-700">{label}</label>
        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{value}{unit}</span>
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step} 
        value={value} 
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
    </div>
  );
}
