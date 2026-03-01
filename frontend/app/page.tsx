'use client';

import Link from 'next/link';
import { FileText, Image as ImageIcon, ArrowRight, Zap, Shield, Layout } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 bg-white border-b">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Layout className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">EasyConvert</span>
        </div>
        <Link 
          href="/features" 
          className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2"
        >
          Get Started <ArrowRight className="w-4 h-4" />
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="px-8 py-20 text-center max-w-5xl mx-auto">
        <h1 className="text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
          Professional File Processing <br />
          <span className="text-blue-600">Made Simple & Fast</span>
        </h1>
        <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          The ultimate toolkit for PDF and Image manipulation. Convert, merge, split, and edit your files with a microservices-powered backend designed for high-performance.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link 
            href="/features" 
            className="px-8 py-4 bg-blue-600 text-white text-lg font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
          >
            Explore Features
          </Link>
          <a 
            href="#features" 
            className="px-8 py-4 bg-white text-slate-700 text-lg font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-all"
          >
            Learn More
          </a>
        </div>
      </section>

      {/* Feature Cards */}
      <section id="features" className="px-8 py-20 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-16">Everything you need in one place</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<FileText className="w-8 h-8 text-blue-600" />}
              title="PDF Suite"
              description="Convert PDFs to images, merge multiple files, split pages, add numbering, and convert to Word documents."
            />
            <FeatureCard 
              icon={<ImageIcon className="w-8 h-8 text-indigo-600" />}
              title="Image Toolkit"
              description="Change formats instantly, combine images into PDFs, and perform advanced edits like cropping and adjustments."
            />
            <FeatureCard 
              icon={<Zap className="w-8 h-8 text-amber-500" />}
              title="High Performance"
              description="Powered by a microservices architecture with asynchronous task processing for heavy operations."
            />
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="px-8 py-20 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <Shield className="w-16 h-16 text-blue-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-6">Privacy & Security First</h2>
          <p className="text-lg text-slate-400 leading-relaxed">
            Your files are processed securely on our servers and automatically cleaned up after processing. We don&apos;t store your personal data or file contents longer than necessary.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 text-center text-slate-500">
        <p>© 2026 EasyConvert. All rights reserved.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-2xl border border-slate-100 bg-slate-50 hover:shadow-xl transition-all group">
      <div className="mb-6 p-4 bg-white rounded-xl w-fit group-hover:scale-110 transition-transform shadow-sm">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
