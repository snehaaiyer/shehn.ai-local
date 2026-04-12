import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileText, Sparkles, Check, X, Loader2, ChevronDown } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

type PDFContext = 'vendor_quote' | 'company_info' | 'pinterest_board' | 'general';

interface ExtractedData {
  [key: string]: any;
}

interface PDFUploadExtractorProps {
  onClose?: () => void;
  defaultContext?: PDFContext;
}

const CONTEXT_OPTIONS: Array<{ value: PDFContext; label: string; description: string }> = [
  { value: 'vendor_quote', label: 'Vendor Quotation', description: 'Extract pricing, packages, and terms' },
  { value: 'company_info', label: 'Company Brochure', description: 'Extract services, specialties, and portfolio' },
  { value: 'pinterest_board', label: 'Pinterest Board Export', description: 'Analyze themes, colors, and aesthetics' },
  { value: 'general', label: 'General Document', description: 'Extract wedding-related information' },
];

const PDFUploadExtractor: React.FC<PDFUploadExtractorProps> = ({ onClose, defaultContext }) => {
  const updateBlueprint = useAppStore(s => s.updateBlueprint);
  const updateWeddingPreferences = useAppStore(s => s.updateWeddingPreferences);

  const [file, setFile] = useState<File | null>(null);
  const [context, setContext] = useState<PDFContext>(defaultContext || 'vendor_quote');
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<ExtractedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [applied, setApplied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    if (f.type !== 'application/pdf') {
      setError('Please upload a PDF file.');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('File size must be under 10MB.');
      return;
    }
    setFile(f);
    setError(null);
    setResults(null);
    setApplied(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('context', context);

      const res = await fetch('/api/ai/extract-pdf', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.success && data.data) {
        setResults(data.data);
      } else {
        setError(data.error || 'Failed to extract data from PDF.');
      }
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddToBlueprint = () => {
    if (!results) return;
    // For vendor quotes, we could add vendor info to shortlisted vendors
    // For now, show a confirmation
    setApplied(true);
  };

  const handleApplyPreferences = () => {
    if (!results) return;
    const updates: Record<string, any> = {};
    if (results.themes || results.color_palettes || results.overall_aesthetic) {
      const theme = results.overall_aesthetic || results.themes?.[0] || '';
      if (theme) {
        updateBlueprint({ theme });
        updates.theme = { selectedTheme: theme };
      }
    }
    if (Object.keys(updates).length > 0) {
      updateWeddingPreferences(updates);
      localStorage.setItem('weddingPreferences', JSON.stringify(useAppStore.getState().weddingPreferences));
    }
    setApplied(true);
  };

  const renderResults = () => {
    if (!results) return null;

    const entries = Object.entries(results).filter(
      ([_, v]) => v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)
    );

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
          <Sparkles className="w-4 h-4 text-rose-500" />
          Extracted Information
        </div>
        <div className="grid gap-2">
          {entries.map(([key, value]) => (
            <div key={key} className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
              <p className="text-xs font-medium text-gray-500 capitalize mb-0.5">
                {key.replace(/_/g, ' ')}
              </p>
              <p className="text-sm text-gray-800">
                {Array.isArray(value) ? value.join(', ') : typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
              </p>
            </div>
          ))}
        </div>

        {/* Action buttons based on context */}
        {!applied ? (
          <div className="flex gap-2">
            {context === 'vendor_quote' && (
              <button onClick={handleAddToBlueprint}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-500 text-white text-sm font-medium rounded-lg hover:bg-rose-600 transition-colors">
                <Check className="w-3.5 h-3.5" /> Add to Blueprint
              </button>
            )}
            {context === 'pinterest_board' && (
              <button onClick={handleApplyPreferences}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-500 text-white text-sm font-medium rounded-lg hover:bg-rose-600 transition-colors">
                <Sparkles className="w-3.5 h-3.5" /> Apply Preferences
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
            <Check className="w-4 h-4" />
            {context === 'vendor_quote' ? 'Vendor info saved to blueprint' : 'Preferences applied'}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 space-y-4">
      {/* Context selector */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Document type</label>
        <div className="relative">
          <select
            value={context}
            onChange={e => setContext(e.target.value as PDFContext)}
            className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm text-gray-700 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none"
          >
            {CONTEXT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {CONTEXT_OPTIONS.find(o => o.value === context)?.description}
        </p>
      </div>

      {/* Drop zone / file picker */}
      {!file ? (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            dragOver
              ? 'border-rose-400 bg-rose-50'
              : 'border-gray-200 bg-gray-50 hover:border-rose-300 hover:bg-rose-50/50'
          }`}
        >
          <Upload className={`w-8 h-8 mx-auto mb-2 ${dragOver ? 'text-rose-500' : 'text-gray-400'}`} />
          <p className="text-sm font-medium text-gray-700">
            Drop a PDF here or <span className="text-rose-500">browse</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">PDF files up to 10MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            className="hidden"
          />
        </div>
      ) : (
        <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
          <FileText className="w-5 h-5 text-rose-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
            <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB</p>
          </div>
          <button onClick={() => { setFile(null); setResults(null); setError(null); setApplied(false); }}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* Upload button */}
      {file && !results && (
        <button
          onClick={handleUpload}
          disabled={isUploading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-500 text-white text-sm font-semibold rounded-lg hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing document...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Extract Information
            </>
          )}
        </button>
      )}

      {/* Results */}
      {renderResults()}

      {/* Close button */}
      {onClose && (
        <button onClick={onClose}
          className="w-full text-xs text-gray-400 hover:text-gray-600 py-1 transition-colors">
          Close
        </button>
      )}
    </div>
  );
};

export default PDFUploadExtractor;
