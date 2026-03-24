'use client';
import { useRef } from "react";
import api from "@/lib/axios";
import { ArrowUpTrayIcon, DocumentTextIcon, TrashIcon } from "@heroicons/react/24/outline";

export interface UploadedFile {
  name: string;
  url: string;
  uploading?: boolean;
  error?: string;
}

interface FileUploaderProps {
  files: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  bucket?: string;
  maxFiles?: number;
}

export default function FileUploader({
  files,
  onChange,
  bucket = "documents",
  maxFiles = 10,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (selected: FileList | null) => {
    if (!selected || selected.length === 0) return;

    const selectedArray = Array.from(selected);

    // Build placeholder entries with a stable index key
    const startIndex = files.length;
    const placeholders: UploadedFile[] = selectedArray.map((f) => ({
      name:      f.name,
      url:       "",
      uploading: true,
    }));

    // Show placeholders immediately
    const withPlaceholders = [...files, ...placeholders];
    onChange(withPlaceholders);

    // Upload each file and update its slot in place
    const result = [...withPlaceholders];

    await Promise.all(
      selectedArray.map(async (file, i) => {
        const idx = startIndex + i;
        const formData = new FormData();
        formData.append("file", file);

        try {
          const res = await api.post(
            `/api/upload/single?bucket=${bucket}`,
            formData,
            { headers: { "Content-Type": "multipart/form-data" } }
          );
          result[idx] = {
            name:      file.name,
            url:       res.data.data.url,
            uploading: false,
          };
        } catch (err: any) {
          result[idx] = {
            name:      file.name,
            url:       "",
            uploading: false,
            error:     err?.response?.data?.message ?? "Upload failed",
          };
        }

        // Update state after each file completes so UI is live
        onChange([...result]);
      })
    );
  };

  const removeFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        className="flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer"
      >
        <ArrowUpTrayIcon className="h-6 w-6 text-gray-400" />
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700">Click or drag files here</p>
          <p className="text-xs text-gray-400 mt-0.5">PDF, JPG, PNG up to 10MB each</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
                file.error
                  ? "border-red-200 bg-red-50"
                  : file.uploading
                    ? "border-gray-200 bg-gray-50"
                    : "border-emerald-200 bg-emerald-50/40"
              }`}
            >
              <DocumentTextIcon className={`h-4 w-4 flex-shrink-0 ${
                file.error ? "text-red-400" : file.uploading ? "text-gray-400" : "text-emerald-500"
              }`} />

              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-800 truncate">{file.name}</p>
                {file.error    && <p className="text-xs text-red-500 mt-0.5">{file.error}</p>}
                {file.uploading && <p className="text-xs text-gray-400 mt-0.5">Uploading...</p>}
                {!file.uploading && !file.error && (
                  <p className="text-xs text-emerald-600 mt-0.5">Uploaded successfully</p>
                )}
              </div>

              {file.uploading ? (
                <svg className="h-4 w-4 animate-spin text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="h-6 w-6 flex items-center justify-center rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer flex-shrink-0"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}