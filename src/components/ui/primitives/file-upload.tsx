import { cn } from "@/lib/utils";
import { useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { IconUpload, IconX, IconFile } from "@tabler/icons-react";
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
  onChange,
  onFilesChange,
}: {
  onChange?: (files: File[]) => void;
  onFilesChange?: (hasFiles: boolean) => void;
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const MAX_VISIBLE_FILES = 2;

  const handleFileSelect = (newFiles: File[]) => {
    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);
    onFilesChange?.(updatedFiles.length > 0);
  };

  const handleConfirm = () => {
    if (files.length > 0 && onChange) {
      onChange(files);
    }
  };

  const handleRemoveFile = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedFiles = files.filter((_, i) => i !== idx);
    setFiles(updatedFiles);
    onFilesChange?.(updatedFiles.length > 0);
  };

  const handleClick = () => {
    if (files.length === 0) {
      fileInputRef.current?.click();
    }
  };

  const { getRootProps, isDragActive } = useDropzone({
    multiple: true,
    noClick: true,
    onDrop: handleFileSelect,
    onDropRejected: (error) => {
      console.log(error);
    },
  });

  return (
    <div className="w-full" {...getRootProps()}>
      <motion.div
        onClick={handleClick}
        whileHover={files.length === 0 ? "animate" : undefined}
        className={cn(
          "p-8 group/file block rounded-2xl w-full relative border-2 border-dashed transition-colors",
          files.length === 0
            ? "cursor-pointer border-gray-200 hover:border-blue-400 bg-gray-50/50"
            : "border-gray-200 bg-gray-50/50"
        )}
      >
        <input
          ref={fileInputRef}
          id="file-upload-handle"
          type="file"
          multiple
          onChange={(e) => handleFileSelect(Array.from(e.target.files || []))}
          className="hidden"
        />
        
        <AnimatePresence mode="wait">
          {files.length === 0 ? (
            <motion.div
              key="upload-area"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center"
            >
              <p className="font-semibold text-gray-700 text-base">
                Upload file
              </p>
              <p className="font-normal text-gray-400 text-sm mt-1">
                Drag or drop your files here or click to upload
              </p>
              <div className="relative w-full mt-6 max-w-xl mx-auto">
                <motion.div
                  layoutId="file-upload"
                  variants={mainVariant}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  }}
                  className={cn(
                    "relative group-hover/file:shadow-xl z-40 bg-white flex items-center justify-center h-24 w-full max-w-[6rem] mx-auto rounded-xl border border-gray-200",
                    "shadow-md"
                  )}
                >
                  {isDragActive ? (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-blue-500 flex flex-col items-center text-sm"
                    >
                      Drop it
                      <IconUpload className="h-5 w-5 text-blue-500 mt-1" />
                    </motion.p>
                  ) : (
                    <IconUpload className="h-6 w-6 text-gray-400" />
                  )}
                </motion.div>

                <motion.div
                  variants={secondaryVariant}
                  className="absolute opacity-0 border-2 border-dashed border-blue-400 inset-0 z-30 bg-transparent flex items-center justify-center h-24 w-full max-w-[6rem] mx-auto rounded-xl"
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="file-list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-3"
            >
              <AnimatePresence mode="popLayout">
                {/* Show first 2 files always */}
                {files.slice(0, MAX_VISIBLE_FILES).map((file, idx) => (
                  <motion.div
                    key={"file" + idx}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ delay: idx * 0.05, type: "spring", stiffness: 300, damping: 25 }}
                    className="relative overflow-hidden z-40 bg-white flex flex-col items-start justify-start p-4 w-full rounded-xl shadow-sm border border-gray-200"
                  >
                    <div className="flex justify-between w-full items-center gap-4">
                      <p className="text-base font-medium text-gray-800 truncate flex-1 min-w-0">
                        {file.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg px-2 py-1 text-sm text-emerald-600 bg-emerald-50 border border-emerald-200">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                        <button
                          onClick={(e) => handleRemoveFile(idx, e)}
                          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                        >
                          <IconX className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                        </button>
                      </div>
                    </div>

                    <div className="flex text-sm flex-row items-center w-full mt-2 justify-between text-gray-500">
                      <span className="px-2 py-0.5 rounded-md bg-gray-100">
                        {file.type || "Unknown type"}
                      </span>
                      <span>
                        modified {new Date(file.lastModified).toLocaleDateString()}
                      </span>
                    </div>
                  </motion.div>
                ))}

                {/* Summary for 3+ files */}
                {files.length > MAX_VISIBLE_FILES && (
                  <motion.div
                    key="collapsed-summary"
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="relative z-40 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center p-4 w-full rounded-xl border border-blue-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {files.slice(MAX_VISIBLE_FILES, MAX_VISIBLE_FILES + 3).map((_, i) => (
                          <motion.div
                            key={i}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="w-8 h-8 rounded-lg bg-white border border-blue-200 flex items-center justify-center shadow-sm"
                          >
                            <IconFile className="w-4 h-4 text-blue-500" />
                          </motion.div>
                        ))}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-blue-700">
                          +{files.length - MAX_VISIBLE_FILES} more {files.length - MAX_VISIBLE_FILES === 1 ? 'file' : 'files'}
                        </p>
                        <p className="text-xs text-blue-500">
                          {(files.slice(MAX_VISIBLE_FILES).reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(2)} MB total
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-3 mt-2">
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="flex-1 py-3 px-4 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 font-medium hover:border-blue-400 hover:text-blue-500 transition-colors"
                >
                  + Add more files
                </motion.button>
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleConfirm();
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/25"
                >
                  Convert
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
