'use client';

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import FileUploader from '@/components/FileUploader';
import { Loader2, Download, AlertCircle, Crop, CheckCircle2, RotateCcw, MousePointer2 } from 'lucide-react';
import { parseAxiosError } from '@/utils/error-handler';

const API_GATEWAY = process.env.NEXT_PUBLIC_API_GATEWAY || 'http://localhost:8000';

export default function CropImagePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Crop values in percentage
  const [top, setTop] = useState(0);
  const [bottom, setBottom] = useState(0);
  const [left, setLeft] = useState(0);
  const [right, setRight] = useState(0);

  // Interactive Dragging State
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFilesSelected = (selectedFiles: File[]) => {
    setFiles(selectedFiles);
    if (selectedFiles.length > 0) {
      const url = URL.createObjectURL(selectedFiles[0]);
      setPreviewUrl(url);
      resetSettings();
    } else {
      setPreviewUrl(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    const rect = containerRef.current.getBoundingClientRect();
    setStartPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currentX = ((e.clientX - rect.left) / rect.width) * 100;
    const currentY = ((e.clientY - rect.top) / rect.height) * 100;

    const x1 = Math.max(0, Math.min(100, startPos.x));
    const x2 = Math.max(0, Math.min(100, currentX));
    const y1 = Math.max(0, Math.min(100, startPos.y));
    const y2 = Math.max(0, Math.min(100, currentY));

    const newLeft = Math.min(x1, x2);
    const newRight = 100 - Math.max(x1, x2);
    const newTop = Math.min(y1, y2);
    const newBottom = 100 - Math.max(y1, y2);

    // Limit to 49% as per slider constraint to avoid negative dimensions
    setLeft(Math.min(49, newLeft));
    setRight(Math.min(49, newRight));
    setTop(Math.min(49, newTop));
    setBottom(Math.min(49, newBottom));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetSettings = () => {
    setTop(0);
    setBottom(0);
    setLeft(0);
    setRight(0);
  };

  const startCropping = async () => {
    if (files.length === 0) return;

    setStatus('processing');
    setError(null);

    const formData = new FormData();
    formData.append('file', files[0]);
    
    const params = new URLSearchParams({
      top: top.toString(),
      bottom: bottom.toString(),
      left: left.toString(),
      right: right.toString()
    });

    try {
      const response = await axios.post(`${API_GATEWAY}/image/crop-image?${params.toString()}`, formData, {
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
        <div className="p-4 bg-green-600 rounded-2xl shadow-lg shadow-green-100">
          <Crop className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Crop Image</h1>
          <p className="text-slate-500">Precise percentage-based cropping from all sides of your image.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <FileUploader 
            onFilesSelected={handleFilesSelected} 
            accept="image/*" 
            isLoading={status === 'processing'}
            title="Upload Image"
            description="Select the image you want to crop"
          />

          {status === 'idle' && files.length > 0 && previewUrl && (
            <div className="flex flex-col gap-8">
              {/* Preview Box */}
              <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col items-center gap-4">
                <div className="flex items-center justify-between w-full border-b border-slate-100 pb-4 mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900">Interactive Preview</h4>
                    <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">New</span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium italic flex items-center gap-1">
                    <MousePointer2 className="w-3 h-3" /> Click and drag on image to select area
                  </span>
                </div>
                
                <div 
                  ref={containerRef}
                  className="relative w-full max-h-[500px] flex items-center justify-center overflow-hidden rounded-xl bg-slate-50 border border-slate-100 p-4 select-none cursor-crosshair"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <div className="relative inline-block">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="max-w-full max-h-[400px] object-contain shadow-md pointer-events-none"
                    />
                    
                    {/* Dark Overlays (Cropped Areas) */}
                    <div className="absolute top-0 left-0 w-full bg-black/50 pointer-events-none" style={{ height: `${top}%` }} />
                    <div className="absolute bottom-0 left-0 w-full bg-black/50 pointer-events-none" style={{ height: `${bottom}%` }} />
                    <div className="absolute top-0 left-0 h-full bg-black/50 pointer-events-none" style={{ width: `${left}%` }} />
                    <div className="absolute top-0 right-0 h-full bg-black/50 pointer-events-none" style={{ width: `${right}%` }} />
                    
                    {/* Clear Area (Keep) */}
                    <div 
                      className="absolute border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.5)] pointer-events-none transition-[top,bottom,left,right] duration-100"
                      style={{
                        top: `${top}%`,
                        bottom: `${bottom}%`,
                        left: `${left}%`,
                        right: `${right}%`
                      }}
                    >
                      <div className="absolute -top-1 -left-1 w-2 h-2 bg-white rounded-full" />
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full" />
                      <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-white rounded-full" />
                      <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-white rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-8 p-8 bg-white border border-slate-200 rounded-3xl shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h4 className="font-bold text-slate-900">Crop Percentages</h4>
                <button 
                  onClick={resetSettings}
                  className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                <PercentageInput label="Crop Top" value={top} onChange={setTop} />
                <PercentageInput label="Crop Bottom" value={bottom} onChange={setBottom} />
                <PercentageInput label="Crop Left" value={left} onChange={setLeft} />
                <PercentageInput label="Crop Right" value={right} onChange={setRight} />
              </div>

              <button 
                onClick={startCropping}
                className="w-full py-4 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 shadow-xl shadow-green-100 transition-all flex items-center justify-center gap-2"
              >
                <Crop className="w-5 h-5" />
                Apply Crop Settings
              </button>
            </div>
          </div>
          )}

          {status === 'processing' && (
            <div className="p-12 bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col items-center text-center gap-6">
              <Loader2 className="w-16 h-16 text-green-600 animate-spin" />
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Cropping Your Image...</h3>
                <p className="text-slate-500 max-w-sm">Cutting the pixels according to your percentages. This is usually instant.</p>
              </div>
            </div>
          )}

          {status === 'completed' && resultUrl && (
            <div className="p-12 bg-white border border-emerald-100 rounded-3xl shadow-sm flex flex-col items-center text-center gap-6">
              <div className="p-5 bg-emerald-50 rounded-full">
                <CheckCircle2 className="w-16 h-16 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Image Cropped!</h3>
                <p className="text-slate-500 max-w-sm">Your adjustments have been applied. Download your cropped image below.</p>
              </div>
              <a 
                href={resultUrl}
                download="cropped_image.png"
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
                <h4 className="font-bold mb-1">Crop Failed</h4>
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
          <div className="p-8 bg-green-900 text-white rounded-3xl shadow-xl">
            <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
              📏 Percentage Cropping
            </h4>
            <p className="text-sm text-green-200 leading-relaxed">
              Unlike pixel-based cropping, percentage-based cropping works on any image resolution. 10% from the top will always cut exactly 1/10th of the height.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PercentageInput({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-slate-700">{label}</label>
        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{value}%</span>
      </div>
      <input 
        type="range" 
        min={0} 
        max={49} 
        step={1} 
        value={value} 
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600 transition-all"
      />
    </div>
  );
}
