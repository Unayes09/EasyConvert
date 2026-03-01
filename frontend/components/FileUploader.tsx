'use client';

import { useState, useRef } from 'react';
import { Upload, X, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  title?: string;
  description?: string;
  isLoading?: boolean;
}

export default function FileUploader({ 
  onFilesSelected, 
  accept = ".pdf", 
  multiple = false,
  title = "Upload Files",
  description = "Drag and drop your files here, or click to browse",
  isLoading = false
}: FileUploaderProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(multiple ? [...selectedFiles, ...files] : files);
      onFilesSelected(multiple ? [...selectedFiles, ...files] : files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files);
      setSelectedFiles(multiple ? [...selectedFiles, ...files] : files);
      onFilesSelected(multiple ? [...selectedFiles, ...files] : files);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles);
  };

  return (
    <div className="space-y-6">
      <div
        className={`relative border-2 border-dashed rounded-3xl p-12 transition-all duration-300 text-center ${
          isDragging 
            ? 'border-blue-500 bg-blue-50 scale-[1.01]' 
            : 'border-slate-200 hover:border-blue-400 bg-white'
        } ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={accept}
          multiple={multiple}
          className="hidden"
        />
        
        <div className="flex flex-col items-center gap-4">
          <div className="p-5 bg-blue-50 rounded-full group-hover:scale-110 transition-transform">
            <Upload className="w-10 h-10 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">{title}</h3>
            <p className="text-slate-500">{description}</p>
          </div>
          <button 
            className="mt-4 px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Choose Files'}
          </button>
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <span className="font-bold text-slate-900 text-sm">Selected Files ({selectedFiles.length})</span>
            <button 
              onClick={() => { setSelectedFiles([]); onFilesSelected([]); }}
              className="text-xs font-semibold text-slate-400 hover:text-red-500 transition-colors"
            >
              Clear All
            </button>
          </div>
          <ul className="divide-y divide-slate-100">
            {selectedFiles.map((file, index) => (
              <li key={index} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    {file.name.endsWith('.pdf') ? (
                      <FileText className="w-5 h-5 text-red-500" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 truncate max-w-[200px]">{file.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                  className="p-1.5 hover:bg-red-50 rounded-full text-slate-400 hover:text-red-500 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
