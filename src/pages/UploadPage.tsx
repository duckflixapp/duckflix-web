import { ArrowLeft, Database, FileText, Film, Keyboard, Link2, Sparkles, Tv, Upload } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import type { VideoType } from '@duckflixapp/shared';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { api } from '../lib/api';
import { UploadedVideosList, type UploadedVideo } from '../components/upload/UploadedVideosList';
import { FileSourceRow, TextSourceRow, UploadProgress } from '../components/upload/UploadSourceRows';
import { StepIndicator, WizardOption, WizardSection } from '../components/upload/WizardSection';
import { ProcessorSelect, type ProcessorId } from '../components/upload/ProcessorSelect';

type SourceType = 'file' | 'text';
type MetadataMode = 'db' | 'manual';

const WIZARD_STEPS = ['Type', 'Source', 'Input', 'Metadata', 'Finish'];

const findProcessor = (sourceType: SourceType, fileName?: string): ProcessorId => {
    if (sourceType === 'text') return 'uploader';
    if (fileName?.endsWith('.torrent')) return 'torrent';
    return 'uploader';
};

const isValidUrl = (value: string) => {
    try {
        new URL(value);
        return true;
    } catch {
        return false;
    }
};

export default function UploadPage() {
    const [type, setType] = useState<VideoType | null>(null);
    const [sourceType, setSourceType] = useState<SourceType | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [sourceText, setSourceText] = useState('');
    const [processor, setProcessor] = useState<ProcessorId>('uploader');
    const [dbUrl, setDbUrl] = useState('');
    const [metadataMode, setMetadataMode] = useState<MetadataMode | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [uploadedVideos, setUploadedVideos] = useState<UploadedVideo[] | null>(null);
    const navigate = useNavigate();

    const hasSource = sourceType === 'file' ? Boolean(file) : sourceText.trim().length > 0;
    const currentStep = !type ? 0 : !sourceType ? 1 : !hasSource ? 2 : !metadataMode ? 3 : 4;
    const contentKey = !type ? 'type' : !sourceType ? 'source' : !metadataMode ? `input-${sourceType}` : `finish-${metadataMode}`;
    const isUploading = uploadProgress !== null;

    const resetSource = () => {
        setFile(null);
        setSourceText('');
        setProcessor('uploader');
        setDbUrl('');
        setMetadataMode(null);
    };

    const handleBack = () => {
        if (isUploading) return;
        if (metadataMode) {
            setMetadataMode(null);
            setDbUrl('');
            return;
        }
        if (hasSource) {
            resetSource();
            return;
        }
        if (sourceType) {
            setSourceType(null);
            return;
        }
        setType(null);
    };

    const handleSelectType = (nextType: VideoType) => {
        if (isUploading) return;
        setType(nextType);
        resetSource();
    };

    const handleSelectSourceType = (nextSourceType: SourceType) => {
        if (isUploading) return;
        setSourceType(nextSourceType);
        setProcessor(findProcessor(nextSourceType));
        resetSource();
    };

    const handleFileChange = (nextFile: File | null) => {
        setFile(nextFile);
        if (nextFile) setProcessor(findProcessor('file', nextFile.name));
        else setProcessor('uploader');
    };

    const handleStepClick = (step: number) => {
        if (isUploading || step >= currentStep) return;

        if (step === 0) {
            setType(null);
            setSourceType(null);
            resetSource();
            return;
        }

        if (step === 1) {
            setSourceType(null);
            resetSource();
            return;
        }

        if (step === 2) {
            resetSource();
            return;
        }

        if (step === 3) {
            setMetadataMode(null);
            setDbUrl('');
        }
    };

    const handleUpload = async (metadataUrl = '') => {
        if (!type || !sourceType) return;
        if (sourceType === 'file' && !file) {
            toast('Select a file first');
            return;
        }
        if (sourceType === 'text' && !sourceText.trim()) {
            toast('Paste a link or text source first');
            return;
        }

        const normalizedDbUrl = metadataUrl.trim();
        if (normalizedDbUrl && !isValidUrl(normalizedDbUrl)) {
            toast('Invalid metadata URL');
            return;
        }

        setUploadProgress(0);
        setUploadedVideos(null);

        const formData = new FormData();
        formData.append('type', type);
        formData.append('sourceType', sourceType);
        formData.append('processor', processor);
        if (normalizedDbUrl) formData.append('dbUrl', normalizedDbUrl);

        if (sourceType === 'file' && file) formData.append('source', file);
        if (sourceType === 'text') formData.append('source', sourceText.trim());

        const data = await api
            .post<{ videos: UploadedVideo[] }>('/videos/upload', formData, {
                onUploadProgress: (progressEvent) => {
                    if (!progressEvent.total) return;
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                },
            })
            .catch((err) => {
                const message = err instanceof AxiosError ? err.response?.data.message : undefined;
                toast('Failed to upload video', { description: message });
                setUploadProgress(null);
            });

        const videos = data?.videos;
        if (!videos) return;

        if (videos.length === 1) {
            navigate(`/details/${videos[0].id}`);
            return;
        }

        setUploadProgress(null);
        setUploadedVideos(videos);
    };

    const handleDbPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
        if (isUploading) return;
        const pastedUrl = event.clipboardData.getData('text').trim();
        if (!pastedUrl) return;

        setDbUrl(pastedUrl);
        if (isValidUrl(pastedUrl)) window.setTimeout(() => void handleUpload(pastedUrl), 0);
    };

    if (uploadedVideos) {
        return <UploadedVideosList videos={uploadedVideos} />;
    }

    return (
        <div className="max-w-6xl w-full mx-auto px-10 py-6 md:px-16 md:py-10 pb-20 flex flex-col gap-y-12 text-white">
            <div className="flex items-center justify-between gap-4 pt-4">
                <button
                    type="button"
                    onClick={handleBack}
                    disabled={currentStep === 0 || isUploading}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/5 text-text/45 hover:text-text/85 hover:bg-white/8 transition-colors disabled:opacity-0 disabled:pointer-events-none cursor-pointer"
                    title="Back"
                >
                    <ArrowLeft size={17} />
                </button>

                <h1 className="text-text text-3xl font-black tracking-tight">Upload Video</h1>

                <span />
            </div>

            <StepIndicator currentStep={currentStep} steps={WIZARD_STEPS} onStepClick={handleStepClick} disabled={isUploading} />

            <AnimatePresence mode="wait">
                <motion.div
                    key={contentKey}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                >
                    {!type && (
                        <WizardSection label="Video Type" desc="Choose what this upload should become.">
                            <WizardOption
                                icon={Film}
                                label="Movie"
                                value="Upload this as a standalone movie."
                                onClick={() => handleSelectType('movie')}
                            />
                            <WizardOption
                                icon={Tv}
                                label="Series episode"
                                value="Upload this as an episode and let metadata resolve the series."
                                onClick={() => handleSelectType('episode')}
                            />
                        </WizardSection>
                    )}

                    {type && !sourceType && (
                        <WizardSection label="Source" desc="Choose whether you want to upload a file or paste a text source.">
                            <WizardOption
                                icon={Upload}
                                label="File"
                                value="Video file, torrent file, or another processor-backed file."
                                onClick={() => handleSelectSourceType('file')}
                            />
                            <WizardOption
                                icon={FileText}
                                label="Text or link"
                                value="Paste a magnet link, URL, or other text source."
                                onClick={() => handleSelectSourceType('text')}
                            />
                        </WizardSection>
                    )}

                    {type && sourceType && !metadataMode && (
                        <div className="flex flex-col gap-4">
                            <WizardSection
                                label={sourceType === 'file' ? 'File' : 'Text Source'}
                                desc={getSourceDescription(sourceType)}
                                trailing={
                                    (sourceType === 'text' || file) && (
                                        <ProcessorSelect value={processor} onChange={setProcessor} disabled={isUploading} />
                                    )
                                }
                            >
                                {sourceType === 'file' ? (
                                    <FileSourceRow file={file} onFileChange={handleFileChange} disabled={isUploading} />
                                ) : (
                                    <TextSourceRow value={sourceText} onChange={setSourceText} disabled={isUploading} />
                                )}
                            </WizardSection>

                            <AnimatePresence initial={false}>
                                {hasSource && (
                                    <motion.div
                                        key="metadata"
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -6 }}
                                        transition={{ duration: 0.16, ease: 'easeOut' }}
                                    >
                                        <WizardSection label="Metadata" desc="Choose how Duckflix should fill video details.">
                                            <WizardOption
                                                icon={Sparkles}
                                                label="Fill automatically"
                                                value="Use the selected source to identify metadata."
                                                onClick={() => void handleUpload()}
                                                disabled={isUploading}
                                            />
                                            <WizardOption
                                                icon={Database}
                                                label="Fill from DB"
                                                value="Paste IMDb or TMDB URL and start the upload."
                                                onClick={() => setMetadataMode('db')}
                                                disabled={isUploading}
                                            />
                                            <WizardOption
                                                icon={Keyboard}
                                                label="Enter manually"
                                                value="Manual metadata entry will be added later."
                                                disabled
                                                type="warn"
                                            />
                                        </WizardSection>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {type && sourceType && metadataMode === 'db' && (
                        <WizardSection label="Finish" desc="Paste a metadata URL and start the upload.">
                            <li className="px-5 py-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                                        <Link2 size={16} className="text-text/50" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white/85 mb-2">Metadata URL</p>
                                        <input
                                            value={dbUrl}
                                            onChange={(event) => setDbUrl(event.target.value)}
                                            onPaste={handleDbPaste}
                                            disabled={isUploading}
                                            placeholder="https://www.imdb.com/title/..."
                                            className="w-full bg-white/5 border border-white/8 rounded-2xl px-3 py-2 outline-none text-xs transition-colors focus:border-primary/50 disabled:opacity-60"
                                            autoFocus
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => void handleUpload(dbUrl)}
                                        disabled={isUploading || !dbUrl.trim()}
                                        className="px-4 py-2.5 mt-auto rounded-2xl bg-primary text-black text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        Start
                                    </button>
                                </div>
                            </li>
                        </WizardSection>
                    )}
                </motion.div>
            </AnimatePresence>

            <AnimatePresence initial={false}>
                {uploadProgress !== null && (
                    <motion.div
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -6 }}
                        transition={{ duration: 0.16, ease: 'easeOut' }}
                    >
                        <UploadProgress progress={uploadProgress} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

const getSourceDescription = (sourceType: SourceType) => {
    if (sourceType === 'file') return 'Paste a file by dropping it here, or choose one from disk.';
    return 'Paste the source text that your processor should import.';
};
