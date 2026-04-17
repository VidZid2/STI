"use client";
import { cn } from "@/lib/utils";
import React, { useRef, useState } from "react";
import { motion } from "motion/react";
import { IconUpload } from "@tabler/icons-react";
import { useDropzone } from "react-dropzone";

const mainVariant = {
  initial: {
    x: 0,
    y: 0,
  },
  animate: {
    x: 20,
    y: -20,
    opacity: 0.9,
  },
};

const secondaryVariant = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
};

export const FileUpload = ({
  files,
  onChange,
  onSave,
}: {
  files?: File[];
  onChange?: (files: File[]) => void;
  onSave?: () => void;
}) => {
  const [internalFiles, setInternalFiles] = useState<File[]>([]);
  const [expanded, setExpanded] = useState(false);
  const currentFiles = files !== undefined ? files : internalFiles;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detect pink theme
  const [isPinkTheme, setIsPinkTheme] = useState(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('pink-theme')
  );

  React.useEffect(() => {
    const checkPinkTheme = () => setIsPinkTheme(document.documentElement.classList.contains('pink-theme'));
    checkPinkTheme();
    const observer = new MutationObserver(checkPinkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const handleFileChange = (newFiles: File[]) => {
    const updatedFiles = [...currentFiles, ...newFiles];
    if (files === undefined) {
      setInternalFiles(updatedFiles);
    }
    onChange && onChange(updatedFiles);
  };

  const handleRemoveFile = (indexToRemove: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedFiles = currentFiles.filter((_, idx) => idx !== indexToRemove);
    if (files === undefined) {
      setInternalFiles(updatedFiles);
    }
    onChange && onChange(updatedFiles);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const { getRootProps, isDragActive } = useDropzone({
    multiple: false,
    noClick: true,
    onDrop: handleFileChange,
    onDropRejected: (error) => {
      console.log(error);
    },
  });

  return (
    <div className="w-full" {...getRootProps()}>
      <motion.div
        onClick={handleClick}
        whileHover="animate"
        className={cn(
          "group/file relative block w-full cursor-pointer overflow-hidden rounded-xl border border-dashed p-6 transition-colors bg-transparent",
          isPinkTheme
            ? "border-pink-300 dark:border-pink-700 hover:bg-pink-50/50 dark:hover:bg-pink-900/10 hover:border-pink-400 dark:hover:border-pink-500"
            : "border-slate-300 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/20"
        )}
      >
        <input
          ref={fileInputRef}
          id="file-upload-handle"
          type="file"
          onChange={(e) => handleFileChange(Array.from(e.target.files || []))}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-1">
          <div className={cn(
            "flex items-center justify-center h-10 w-10 rounded-lg mb-1",
            isPinkTheme 
              ? "bg-pink-100/50 dark:bg-pink-500/10" 
              : "bg-blue-100/50 dark:bg-blue-500/10"
          )}>
            <IconUpload className={cn(
              "h-5 w-5",
              isPinkTheme 
                ? "text-pink-500 dark:text-pink-400" 
                : "text-blue-500 dark:text-blue-400"
            )} />
          </div>
          <p className="relative z-20 font-sans text-sm font-semibold text-slate-700 dark:text-slate-300">
            Click to upload files
          </p>
          <p className="relative z-20 font-sans text-[11px] font-normal text-slate-500 dark:text-slate-400">
            PDF, DOCX, images, or any file type
          </p>
          <div className="relative mx-auto mt-4 w-full max-w-xl">
            {currentFiles.length > 0 &&
              (expanded ? currentFiles : currentFiles.slice(0, 2)).map((file, idx) => (
                <motion.div
                  key={"file" + idx}
                  layoutId={idx === 0 ? "file-upload" : "file-upload-" + idx}
                  className={cn(
                    "relative z-40 mx-auto mt-4 flex w-full flex-col items-start justify-start overflow-hidden rounded-md p-4 md:h-24",
                    "shadow-[0px_2px_10px_rgba(0,0,0,0.08)]",
                    isPinkTheme
                      ? "bg-white dark:bg-[#1a0a14] border border-pink-100 dark:border-pink-900/40"
                      : "bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700",
                  )}
                >
                  <div className="flex w-full items-center justify-between gap-4">
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      layout
                      className="max-w-xs truncate text-base font-medium text-slate-700 dark:text-slate-100"
                    >
                      {file.name}
                    </motion.p>
                    <div className="flex items-center gap-2">
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        layout
                        className={cn(
                          "w-fit shrink-0 rounded-lg px-2 py-1 text-sm font-medium",
                          isPinkTheme
                            ? "bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-300"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200"
                        )}
                      >
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </motion.p>
                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                        whileTap={{ scale: 0.95 }}
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors"
                        onClick={(e) => handleRemoveFile(idx, e)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </motion.button>
                    </div>
                  </div>

                  <div className="mt-2 flex w-full flex-col items-start justify-between text-sm md:flex-row md:items-center">
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      layout
                      className={cn(
                        "rounded-md px-1.5 py-0.5 text-xs font-medium",
                        isPinkTheme
                          ? "bg-pink-50 text-pink-500 dark:bg-pink-900/25 dark:text-pink-400"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                      )}
                    >
                      {file.type || 'unknown'}
                    </motion.p>

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      layout
                      className="text-slate-400 dark:text-slate-500 text-xs"
                    >
                      modified{" "}
                      {new Date(file.lastModified).toLocaleDateString()}
                    </motion.p>
                  </div>
                </motion.div>
              ))}

            {currentFiles.length > 2 && !expanded && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                layout
                onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
                className="relative z-40 mx-auto mt-3 flex w-full cursor-pointer items-center justify-between rounded-xl p-3 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              >
                <div className="flex items-center gap-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500 dark:text-slate-400">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Attachments</span>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: '10px',
                    background: isPinkTheme ? '#ec4899' : '#3b82f6',
                    color: '#fff',
                  }}>
                    +{currentFiles.length - 2} more
                  </span>
                </div>
                <span className="text-xs font-medium text-slate-400 dark:text-slate-500">Click to view all</span>
              </motion.div>
            )}

            {currentFiles.length > 2 && expanded && (
              <div className="relative z-40 mx-auto mt-2 w-full flex justify-end">
                <button
                  onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
                  className={cn(
                    "text-sm font-medium hover:text-blue-800 transition-colors",
                    isPinkTheme 
                      ? "text-pink-600 dark:text-pink-400" 
                      : "text-blue-600 dark:text-blue-400"
                  )}
                >
                  Show less
                </button>
              </div>
            )}

            {currentFiles.length > 0 && (
              <div className="relative z-40 mx-auto mt-6 flex w-full gap-4 flex-col sm:flex-row">
                <button
                  onClick={(e) => { e.stopPropagation(); handleClick(); }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 rounded-lg border-2 border-dashed py-3 text-sm font-semibold transition-colors",
                    isPinkTheme
                      ? "border-pink-300 bg-pink-50/60 hover:bg-pink-100/60 hover:border-pink-400 text-pink-500 dark:bg-pink-950/30 dark:border-pink-800 dark:hover:border-pink-600 dark:text-pink-400 dark:hover:bg-pink-900/30"
                      : "border-slate-300 bg-slate-50/60 hover:bg-slate-100/60 hover:border-slate-400 text-slate-500 dark:bg-slate-800/50 dark:border-slate-600 dark:hover:border-slate-500 dark:text-slate-300 dark:hover:bg-slate-700/50"
                  )}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  Add more files
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSave) onSave();
                  }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 rounded-lg shadow-sm py-3 text-sm font-semibold text-white transition-colors",
                    isPinkTheme
                      ? "bg-[#ec4899] hover:bg-[#db2777] dark:bg-[#be185d] dark:hover:bg-[#9d174d]"
                      : "bg-[#2563eb] hover:bg-[#1d4ed8] dark:bg-[#1d4ed8] dark:hover:bg-[#1e40af]"
                  )}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                  Save Attachments
                </button>
              </div>
            )}
            {!currentFiles.length && (
              <div className="relative mx-auto mt-2 h-24 w-full max-w-[6rem]">
                <motion.div
                  layoutId="file-upload"
                  variants={mainVariant}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  }}
                  className={cn(
                    "absolute inset-0 z-40 flex items-center justify-center rounded-md bg-white group-hover/file:shadow-xl dark:bg-slate-800",
                    "shadow-[0px_10px_30px_rgba(0,0,0,0.1)]",
                  )}
                >
                  {isDragActive ? (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center text-xs text-slate-600 dark:text-slate-300"
                    >
                      Drop it
                      <IconUpload className="h-4 w-4 text-slate-600 dark:text-slate-400 mt-1" />
                    </motion.p>
                  ) : (
                    <IconUpload className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  )}
                </motion.div>

                <motion.div
                  variants={secondaryVariant}
                  className={cn(
                    "absolute inset-0 z-30 flex items-center justify-center rounded-md border border-dashed bg-transparent opacity-0",
                    isPinkTheme ? "border-pink-400" : "border-sky-400"
                  )}
                ></motion.div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export function GridPattern() {
  const columns = 41;
  const rows = 11;
  return (
    <div className="flex shrink-0 scale-105 flex-wrap items-center justify-center gap-x-px gap-y-px bg-slate-100/50 dark:bg-slate-900/40">
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: columns }).map((_, col) => {
          const index = row * columns + col;
          return (
            <div
              key={`${col}-${row}`}
              className={`flex h-10 w-10 shrink-0 rounded-[2px] ${index % 2 === 0
                ? "bg-slate-50/50 dark:bg-slate-800/40"
                : "bg-slate-50/50 shadow-[0px_0px_1px_3px_rgba(255,255,255,1)_inset] dark:bg-slate-800/40 dark:shadow-[0px_0px_1px_3px_rgba(0,0,0,0.2)_inset]"
                }`}
            />
          );
        }),
      )}
    </div>
  );
}
