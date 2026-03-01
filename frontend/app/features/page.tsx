'use client';

import Link from 'next/link';
import { 
  FileText, 
  Image as ImageIcon, 
  Merge, 
  Scissors, 
  Hash, 
  PlusSquare, 
  FileType, 
  Settings, 
  Crop, 
  ArrowRight 
} from 'lucide-react';

const allFeatures = [
  { id: 'pdf-to-images', title: 'PDF to Images', description: 'Convert PDF pages to high-quality PNG images asynchronously.', icon: FileText, color: 'blue', path: '/features/pdf-to-images' },
  { id: 'merge-pdfs', title: 'Merge PDFs', description: 'Combine multiple PDF files into a single document.', icon: Merge, color: 'indigo', path: '/features/merge-pdfs' },
  { id: 'split-pdf', title: 'Split PDF', description: 'Extract specific pages or ranges from your PDF.', icon: Scissors, color: 'purple', path: '/features/split-pdf' },
  { id: 'add-page-numbers', title: 'Add Page Numbers', description: 'Add professional page numbering to your document.', icon: Hash, color: 'pink', path: '/features/add-page-numbers' },
  { id: 'insert-image', title: 'Insert Image', description: 'Insert images as new pages into existing PDFs.', icon: PlusSquare, color: 'cyan', path: '/features/insert-image' },
  { id: 'pdf-to-docx', title: 'PDF to Word', description: 'Convert your PDF files to editable Word documents.', icon: FileType, color: 'sky', path: '/features/pdf-to-docx' },
  { id: 'change-format', title: 'Change Format', description: 'Quickly convert between different image formats.', icon: FileType, color: 'orange', path: '/features/change-format' },
  { id: 'images-to-pdf', title: 'Images to PDF', description: 'Combine multiple images into a single PDF file.', icon: FileText, color: 'red', path: '/features/images-to-pdf' },
  { id: 'edit-image', title: 'Edit Image', description: 'Adjust brightness, contrast, and more.', icon: Settings, color: 'emerald', path: '/features/edit-image' },
  { id: 'crop-image', title: 'Crop Image', description: 'Precise percentage-based cropping for your images.', icon: Crop, color: 'green', path: '/features/crop-image' },
];

export default function FeaturesPage() {
  return (
    <div className="space-y-12 pb-20">
      <div className="space-y-4">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Select a Feature</h1>
        <p className="text-lg text-slate-500 max-w-2xl">
          Choose from our professional suite of PDF and Image processing tools to get started with your conversion task.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allFeatures.map((feature) => (
          <Link 
            key={feature.id} 
            href={feature.path}
            className="group relative p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300"
          >
            <div className={`p-3 rounded-xl bg-${feature.color}-50 w-fit mb-6 group-hover:scale-110 transition-transform`}>
              <feature.icon className={`w-6 h-6 text-${feature.color}-600`} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{feature.title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              {feature.description}
            </p>
            <div className="flex items-center text-blue-600 font-semibold text-sm">
              Use Tool <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
