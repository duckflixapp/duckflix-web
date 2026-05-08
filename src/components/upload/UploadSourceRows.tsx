import { FileIcon, FileText, Upload, X } from 'lucide-react';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { formatBytes } from '../../utils/format';

export function FileSourceRow({
    file,
    onFileChange,
    disabled,
}: {
    file: File | null;
    onFileChange: (file: File | null) => void;
    disabled: boolean;
}) {
    const onDrop = useCallback(
        async (acceptedFiles: File[]) => {
            if (disabled) return;
            const droppedFile = acceptedFiles[0];
            if (!droppedFile) return;

            onFileChange(droppedFile);
        },
        [disabled, onFileChange]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxFiles: 1,
        disabled,
        accept: {
            'video/*': ['.mp4', '.mkv', '.avi', '.mov'],
            'application/x-bittorrent': ['.torrent'],
        },
    });

    const fileSize = file ? formatBytes(file.size) : null;

    return (
        <li>
            <div
                {...getRootProps()}
                className={`group w-full flex items-center gap-4 px-5 py-4 transition-colors focus-visible:outline-none focus-visible:ring-2 ${
                    disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-white/4'
                } ${isDragActive ? 'bg-primary/5' : ''}`}
            >
                <input {...getInputProps()} />
                <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                    {file ? (
                        <FileIcon size={16} className="text-primary" />
                    ) : (
                        <Upload size={16} className="text-text group-hover:text-primary" />
                    )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                    <p className={`text-sm font-medium truncate ${file ? 'text-primary' : 'text-white/85'}`}>
                        {file ? file.name : isDragActive ? 'Drop it here' : 'Choose or drop file'}
                    </p>
                    <p className="text-xs text-white/40 mt-0.5 truncate">{fileSize ?? 'MP4, MKV, AVI, MOV or .torrent'}</p>
                </div>
                {file && !disabled && (
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            onFileChange(null);
                        }}
                        className="p-2 rounded-full text-white/25 hover:text-white/70 hover:bg-white/6 transition-colors cursor-pointer"
                        title="Remove file"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>
        </li>
    );
}

export function TextSourceRow({ value, onChange, disabled }: { value: string; onChange: (value: string) => void; disabled: boolean }) {
    return (
        <li className="px-5 py-4">
            <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0 mt-1">
                    <FileText size={16} className="text-text" />
                </div>
                <div className="flex-1 min-w-0">
                    <textarea
                        value={value}
                        onChange={(event) => onChange(event.target.value)}
                        disabled={disabled}
                        placeholder="Paste a magnet link, URL, or text source..."
                        className="w-full min-h-32 bg-white/5 border border-white/8 rounded-3xl px-4 py-3 outline-none text-sm leading-relaxed resize-none transition-colors focus:border-primary/50 disabled:opacity-60"
                    />
                    <p className="text-xs text-white/35 mt-2 px-1">Metadata options will appear after you paste a source.</p>
                </div>
            </div>
        </li>
    );
}

export function UploadProgress({ progress }: { progress: number }) {
    return (
        <section className="my-2">
            <div className="rounded-3xl border border-secondary/12 bg-secondary/5 overflow-hidden px-5 py-4">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-medium uppercase tracking-wide text-primary">
                        {progress < 100 ? 'Uploading to server...' : 'Processing on server...'}
                    </span>
                    <span className="text-[10px] font-medium text-primary">{progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded overflow-hidden border border-white/5">
                    <div
                        className="h-full bg-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)] transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </section>
    );
}
