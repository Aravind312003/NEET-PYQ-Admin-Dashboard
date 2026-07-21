import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Loader2,
  Trash2,
  ListRestart,
  Download,
} from 'lucide-react';

export default function Upload() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalParsed, setTotalParsed] = useState(0);
  const [successRecords, setSuccessRecords] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'parsing' | 'uploading' | 'completed' | 'error'>('idle');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    setErrors([]);
    setUploadStatus('idle');

    const extension = selectedFile.name.split('.').pop()?.toLowerCase();
    if (extension !== 'csv' && extension !== 'xlsx' && extension !== 'xls') {
      setErrors(['Invalid file format. Only CSV or Excel sheets are accepted.']);
      setUploadStatus('error');
      return;
    }

    setFile(selectedFile);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setErrors([]);
    setUploadProgress(0);
    setProcessedCount(0);
    setTotalParsed(0);
    setSuccessRecords(0);
    setUploadStatus('idle');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Process the CSV/Excel file
  const handleUploadSubmit = async () => {
    if (!file) return;

    setParsing(true);
    setUploadStatus('parsing');
    setErrors([]);

    // Read the file as text
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) {
        setErrors(['Could not read file content. Please verify your document is valid.']);
        setUploadStatus('error');
        setParsing(false);
        return;
      }

      // Quick Parse CSV Rows
      try {
        const lines = text.split(/\r?\n/);
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        // Validate basic expected headers
        const requiredHeaders = ['year', 'subject', 'chapter', 'question', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer', 'explanation'];
        const missing = requiredHeaders.filter(h => !headers.includes(h));

        if (missing.length > 0) {
          setErrors([
            `Missing required CSV headers: ${missing.join(', ')}. Please use our NEET Question Import Schema template.`,
          ]);
          setUploadStatus('error');
          setParsing(false);
          return;
        }

        const parsedRows: any[] = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          // Naive CSV split that handles quotes if necessary
          const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => {
            let s = v.trim();
            if (s.startsWith('"') && s.endsWith('"')) {
              s = s.slice(1, -1).replace(/""/g, '"');
            }
            return s;
          });

          if (values.length < headers.length) {
            continue; // Skip malformed rows
          }

          const rowObj: any = {};
          headers.forEach((header, idx) => {
            rowObj[header] = values[idx] || '';
          });

          parsedRows.push(rowObj);
        }

        if (parsedRows.length === 0) {
          setErrors(['The CSV file contains zero queryable question records.']);
          setUploadStatus('error');
          setParsing(false);
          return;
        }

        setTotalParsed(parsedRows.length);
        setUploadStatus('uploading');

        // Let's transmit chunks to the Express server API
        const token = localStorage.getItem('adminToken');
        if (!token) {
          navigate('/admin/login');
          return;
        }

        // We will simulate progression chunks and validate on Express backend
        let successfulCount = 0;
        const uploadErrors: string[] = [];

        // Send payload in batches of 100 for heavy payloads
        const batchSize = 100;
        for (let idx = 0; idx < parsedRows.length; idx += batchSize) {
          const batch = parsedRows.slice(idx, idx + batchSize);

          const response = await fetch('/api/admin/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ questions: batch }),
          });

          const data = await response.json();
          if (!response.ok) {
            uploadErrors.push(`Batch ${idx / batchSize + 1} Failed: ${data.message || 'API connection collapsed.'}`);
          } else {
            successfulCount += data.inserted || 0;
            if (data.errors && data.errors.length > 0) {
              uploadErrors.push(...data.errors.map((e: string) => `Row validation: ${e}`));
            }
          }

          const progress = Math.min(100, Math.round(((idx + batch.length) / parsedRows.length) * 100));
          setUploadProgress(progress);
          setProcessedCount(idx + batch.length);
        }

        setSuccessRecords(successfulCount);
        setErrors(uploadErrors);
        setUploadStatus('completed');
      } catch (err) {
        console.error('File processing error:', err);
        setErrors(['Error compiling or uploading question rows. Check formatting.']);
        setUploadStatus('error');
      } finally {
        setParsing(false);
      }
    };

    reader.onerror = () => {
      setErrors(['File reader encountered an error. Document may be locked.']);
      setUploadStatus('error');
      setParsing(false);
    };

    reader.readAsText(file);
  };

  const triggerDownloadTemplate = () => {
    const csvContent =
      'year,subject,chapter,question_number,question,option_a,option_b,option_c,option_d,correct_answer,explanation,difficulty\n' +
      '2023,Biology,Photosynthesis in Higher Plants,1,Which pigment acts directly to convert light energy to chemical energy?,Chlorophyll a,Chlorophyll b,Xanthophyll,Carotenoid,A,Chlorophyll a is the primary pigment that directly absorbs photons and participates in light reaction.,Easy\n' +
      '2022,Chemistry,Chemical Bonding,4,Which molecule shows maximum dipole moment?,NH3,NF3,CO2,CH4,A,NH3 has a higher dipole moment than NF3 due to loan pair direction reinforce bond dipole moments.,Medium';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'neet_questions_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-black text-neutral-900 dark:text-neutral-50 tracking-tight">
          CSV / Excel Question Import
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Streamline importing thousands of NEET previous year questions simultaneously. Avoid manual typing errors.
        </p>
      </div>

      {/* Main Drag Box */}
      {uploadStatus !== 'completed' && uploadStatus !== 'uploading' && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all bg-white dark:bg-neutral-900 ${
            isDragOver
              ? 'border-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/20'
              : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
          }`}
        >
          <div className="p-4 bg-emerald-500/10 rounded-full text-emerald-600 dark:text-emerald-400 mb-4">
            <UploadCloud className="h-10 w-10" />
          </div>

          <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-200">
            Drag & Drop CSV / Excel sheet here
          </h3>
          <p className="text-xs text-neutral-400 mt-1.5 mb-6">
            or choose a file from your computer file explorer
          </p>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            className="hidden"
          />

          <div className="flex gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-white rounded-lg text-xs font-semibold shadow-md transition-colors cursor-pointer"
            >
              Browse Files
            </button>
            <button
              onClick={triggerDownloadTemplate}
              className="px-4 py-2 border border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800 rounded-lg text-xs font-semibold text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              Download CSV Template
            </button>
          </div>
        </div>
      )}

      {/* File Selected Meta */}
      {file && uploadStatus !== 'completed' && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950 rounded-lg text-emerald-600 dark:text-emerald-400 shrink-0">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-neutral-800 dark:text-neutral-100 truncate">
                {file.name}
              </p>
              <p className="text-[10px] text-neutral-400 font-mono">
                {(file.size / 1024).toFixed(1)} KB • Document Verified
              </p>
            </div>
          </div>

          {uploadStatus !== 'uploading' && (
            <div className="flex gap-2">
              <button
                onClick={handleRemoveFile}
                disabled={parsing}
                className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                title="Discard file"
              >
                <Trash2 className="h-4.5 w-4.5" />
              </button>
              <button
                onClick={handleUploadSubmit}
                disabled={parsing}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer shadow-md"
              >
                {parsing ? 'Parsing Sheet...' : 'Begin Questions Import'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Uploading Progress Panel */}
      {uploadStatus === 'uploading' && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 shadow-md text-center max-w-md mx-auto">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mx-auto mb-4" />
          <h3 className="font-bold text-base text-neutral-800 dark:text-neutral-100">
            Injecting Question Records...
          </h3>
          <p className="text-xs text-neutral-400 mt-1">
            Running row validation and inserting questions into the database. Do not reload.
          </p>

          <div className="mt-6">
            <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] font-mono font-semibold text-neutral-400 mt-2">
              <span>{uploadProgress}% COMPLETE</span>
              <span>
                {processedCount} / {totalParsed} RECORDS
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Completed Success & Error Summary */}
      {uploadStatus === 'completed' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 shadow-md text-center max-w-md mx-auto">
            <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle className="h-6 w-6" />
            </div>
            <h3 className="font-black text-lg text-neutral-800 dark:text-neutral-50">
              Import Session Completed
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              File transaction resolved. Questions are instantly searchable and editable.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4 bg-neutral-50 dark:bg-neutral-950 rounded-xl p-4 border border-neutral-100 dark:border-neutral-800 text-center">
              <div>
                <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                  {successRecords}
                </p>
                <p className="text-[10px] text-neutral-400 font-semibold uppercase">Successful</p>
              </div>
              <div>
                <p className="text-sm font-black text-rose-600 dark:text-rose-400">
                  {totalParsed - successRecords}
                </p>
                <p className="text-[10px] text-neutral-400 font-semibold uppercase">Discarded / Failed</p>
              </div>
            </div>

            <button
              onClick={handleRemoveFile}
              className="mt-6 w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-white font-bold text-xs"
            >
              <ListRestart className="h-4 w-4" />
              Upload Another Document
            </button>
          </div>

          {/* Details on specific row parse issues */}
          {errors.length > 0 && (
            <div className="bg-white dark:bg-neutral-900 border border-red-200 dark:border-red-950/30 rounded-xl p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-3 text-red-600 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="font-bold text-sm">Document Parsing & Validation Errors</h3>
              </div>
              <p className="text-xs text-neutral-400 mb-3 leading-relaxed">
                The following rows skipped database insertion due to missing values, formatting anomalies, or out-of-range keys:
              </p>
              <div className="max-h-52 overflow-y-auto border border-neutral-100 dark:border-neutral-800 rounded-lg p-3 space-y-1.5 font-mono text-[10px] text-neutral-500 bg-neutral-50 dark:bg-neutral-950">
                {errors.map((err, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-red-500 font-bold shrink-0">Line [Err]:</span>
                    <span>{err}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CSV Template Details Block */}
      {uploadStatus === 'idle' && (
        <div className="bg-neutral-100 dark:bg-neutral-900/40 rounded-xl p-5 border border-neutral-200 dark:border-neutral-800/60 flex gap-4">
          <HelpCircle className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h4 className="font-bold text-xs text-neutral-800 dark:text-neutral-200">
              CSV Question Formatting Requirements
            </h4>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              To guarantee zero insertion failures, make sure your headers match the schema template. Text fields containing commas or line breaks MUST be wrapped in double quotes (e.g. <code>"Which of these, in NCERT, is..."</code>). Make sure there are no blank rows in your document.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
