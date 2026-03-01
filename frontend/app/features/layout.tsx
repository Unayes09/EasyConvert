'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Layout,
  ArrowLeft
} from 'lucide-react';

const pdfFeatures = [
  { id: 'convert-pdf-async', name: 'PDF to Images', icon: FileText, path: '/features/pdf-to-images' },
  { id: 'merge-pdfs', name: 'Merge PDFs', icon: Merge, path: '/features/merge-pdfs' },
  { id: 'split-pdf', name: 'Split PDF', icon: Scissors, path: '/features/split-pdf' },
  { id: 'add-page-numbers', name: 'Add Page Numbers', icon: Hash, path: '/features/add-page-numbers' },
  { id: 'insert-image', name: 'Insert Image', icon: PlusSquare, path: '/features/insert-image' },
  { id: 'pdf-to-docx', name: 'PDF to Word', icon: FileType, path: '/features/pdf-to-docx' },
];

const imageFeatures = [
  { id: 'change-format', name: 'Change Format', icon: FileType, path: '/features/change-format' },
  { id: 'images-to-pdf', name: 'Images to PDF', icon: FileText, path: '/features/images-to-pdf' },
  { id: 'edit-image', name: 'Edit Image', icon: Settings, path: '/features/edit-image' },
  { id: 'crop-image', name: 'Crop Image', icon: Crop, path: '/features/crop-image' },
];

export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-50 border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-1.5 bg-blue-600 rounded-md group-hover:bg-blue-700 transition-colors">
              <Layout className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-900">EasyConvert</span>
          </Link>
          <Link href="/" className="text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-8">
          <div>
            <h3 className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">PDF Tools</h3>
            <div className="space-y-1">
              {pdfFeatures.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.id}
                    href={item.path}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-100' 
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Image Tools</h3>
            <div className="space-y-1">
              {imageFeatures.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.id}
                    href={item.path}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-100' 
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-blue-700 mb-1">Microservices Enabled</p>
            <p className="text-[10px] text-blue-600 leading-relaxed">
              All tasks are processed across specialized worker nodes for maximum speed.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50/30">
        <div className="p-8 max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
