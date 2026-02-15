import { Upload, FileIcon, X, Check, Database, Settings2 } from 'lucide-react';
import { forwardRef, useCallback, useState, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { useForm, useWatch, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDropzone } from 'react-dropzone';
import { formatBytes } from '../utils/format';
import { createMovieSchema, type MovieFormValues } from '../schemas/movie';
import { useGenres } from '../hooks/use-genres';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import type { MovieDTO } from '@duckflix/shared';

export default function UploadPage() {
    const { genres } = useGenres();
    const [file, setFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [showManual, setShowManual] = useState(false); // State za prikazivanje rucnog unosa
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        control,
    } = useForm({
        resolver: zodResolver(createMovieSchema),
        defaultValues: {
            title: '',
            overview: '',
            dbUrl: '',
            genreIds: [],
        },
    });

    const selectedGenreIds = useWatch({
        control,
        name: 'genreIds',
        defaultValue: [],
    });

    const onSubmit = async (values: MovieFormValues) => {
        if (!file) {
            alert('Please upload a video or a .torrent file.');
            return;
        }

        setUploadProgress(0);
        const formData = new FormData();

        Object.entries(values).forEach(([key, value]) => {
            if (key === 'genreIds' && Array.isArray(value)) {
                value.forEach((id) => formData.append('genreIds[]', id));
            } else if (value !== null && value !== undefined && value !== '') {
                formData.append(key, value.toString());
            }
        });

        if (file) {
            if (file.name.endsWith('.torrent')) {
                formData.append('torrent', file);
            } else {
                formData.append('video', file);
            }
        }

        const data = await api
            .post<{ movie: MovieDTO }>('/movies/upload', formData as never, {
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total!);
                    setUploadProgress(percentCompleted);
                },
            })
            .catch((err) => {
                console.error('Upload error:', err);
                alert('Error while uploading');
                setUploadProgress(null);
            });

        if (data) navigate(`/details/${data.movie.id}`);
    };

    const changeFile = (file: File | null) => setFile(file);

    return (
        <div className="w-full xl:pr-56 transition-all duration-300">
            <form onSubmit={handleSubmit(onSubmit)} className="max-w-5xl w-full mx-auto py-6 px-8 md:py-12 text-white space-y-6">
                <header className="mb-4">
                    <h1 className="text-2xl font-black tracking-tight">Upload Video</h1>
                </header>

                <UploadSection
                    progress={uploadProgress}
                    file={file}
                    onFileChange={changeFile}
                    onToggleManual={() => setShowManual(!showManual)}
                    showManual={showManual}
                    register={register}
                    errors={errors}
                />

                {showManual && (
                    <section className="bg-white/5 border border-white/10 rounded-4xl p-8 md:p-10 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-4">
                            <Settings2 size={18} className="text-primary" />
                            <h2 className="text-sm font-black uppercase tracking-widest text-white/50">Manual Information</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                            <FormInput
                                label="Movie Title"
                                error={errors.title}
                                placeholder="Star Wars: Revenge of the Sith"
                                {...register('title')}
                            />
                            <FormInput
                                elementType="textarea"
                                label="Overview"
                                error={errors.overview}
                                placeholder="Brief summary..."
                                {...register('overview')}
                            />

                            <div className="space-y-6">
                                <FormInput
                                    label="Poster URL"
                                    error={errors.posterUrl}
                                    placeholder="https://..."
                                    {...register('posterUrl')}
                                />
                                <FormInput
                                    label="Release Year"
                                    error={errors.releaseYear}
                                    placeholder="e.g. 1983"
                                    {...register('releaseYear')}
                                />
                            </div>

                            <div className="space-y-6">
                                <FormInput
                                    label="Banner URL"
                                    error={errors.bannerUrl}
                                    placeholder="https://..."
                                    {...register('bannerUrl')}
                                />

                                <div>
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] mb-2 uppercase tracking-[0.2em] text-white/30 font-black block">
                                            Select Genres
                                        </label>
                                        {errors.genreIds && (
                                            <span className="text-red-500 text-[10px] font-bold ">{errors.genreIds.message}</span>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        {genres &&
                                            genres.map((genre) => {
                                                const isSelected = selectedGenreIds?.includes(genre.id);
                                                return (
                                                    <button
                                                        key={genre.id}
                                                        type="button"
                                                        onClick={() => {
                                                            const nextValue = isSelected
                                                                ? selectedGenreIds?.filter((id) => id !== genre.id)
                                                                : [...(selectedGenreIds ?? []), genre.id];

                                                            setValue('genreIds', nextValue, { shouldValidate: true });
                                                        }}
                                                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border
                                                    ${
                                                        isSelected
                                                            ? 'bg-primary border-primary text-black shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]'
                                                            : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20 hover:bg-white/10'
                                                    }`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            {genre.name}
                                                            {isSelected && <Check size={12} strokeWidth={3} />}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                <div className="mt-6 lg:mt-10 pt-4 flex justify-end">
                    <button
                        type="submit"
                        className="w-full md:w-auto px-12 py-4 cursor-pointer bg-primary text-black font-black rounded-xl transition-all uppercase tracking-[0.2em] text-xs shadow-lg shadow-primary/10"
                    >
                        Upload
                    </button>
                </div>
            </form>
        </div>
    );
}

function UploadSection({
    file,
    progress,
    onFileChange: changeFile,
    onToggleManual,
    showManual,
    register,
    errors,
}: {
    file: File | null;
    progress: number | null;
    onFileChange: (file: File | null) => void;
    onToggleManual: () => void;
    showManual: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    register: UseFormRegister<any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    errors: FieldErrors<any>;
}) {
    const onDrop = useCallback(
        async (acceptedFiles: File[]) => {
            const droppedFile = acceptedFiles[0];
            if (!droppedFile) return;

            changeFile(droppedFile);
        },
        [changeFile]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxFiles: 1,
        accept: {
            'video/*': ['.mp4', '.mkv', '.avi'],
            'application/x-bittorrent': ['.torrent'],
        },
    });

    const onRemoveFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        changeFile(null);
    };

    const fileSize = file ? formatBytes(file.size) : null;

    return (
        <section className="bg-white/5 border border-white/10 rounded-4xl p-6 md:p-8 shadow-xl space-y-8">
            <div className="relative flex flex-col lg:flex-row gap-6 justify-stretch items-stretch">
                {/* Dropzone */}
                <div
                    {...getRootProps()}
                    className={`flex-1 min-w-0 w-full border-2 border-dashed rounded-2xl p-6 flex items-center gap-4 transition-all cursor-pointer group ${isDragActive ? 'border-primary bg-primary/5' : 'border-white/10 hover:bg-white/2'}`}
                >
                    <input {...getInputProps()} />

                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        {file ? <FileIcon className="text-primary" size={24} /> : <Upload className="text-primary" size={24} />}
                    </div>

                    <div className="text-left flex-1 min-w-0">
                        {file ? (
                            <>
                                <h2 className="font-bold text-sm text-primary truncate">{file.name}</h2>
                                <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1">{fileSize}</p>
                            </>
                        ) : (
                            <>
                                <h2 className="font-bold text-sm">{isDragActive ? 'Drop it now!' : 'Drop your video here'}</h2>
                                <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1">MP4, MKV, AVI or .torrent</p>
                            </>
                        )}
                    </div>

                    {file && (
                        <button
                            onClick={onRemoveFile}
                            className="p-2 hover:bg-white/10 rounded-lg text-white/20 hover:text-white transition-colors"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
                {/* Database Links & Manual Toggle */}
                <div className="flex-1 w-full lg:w-80 xl:w-100 space-y-4">
                    <div className="flex flex-col gap-px">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-2">
                                <Database size={12} />
                                <span>Auto-fill from DB</span>
                            </div>
                            {errors.dbUrl && (
                                <p className="text-red-500 text-[10px] font-bold animate-in fade-in">{errors.dbUrl.message?.toString()}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <div className="relative">
                                <input
                                    {...register('dbUrl')}
                                    placeholder="themoviedb.org/movie..."
                                    className={`w-full bg-black/20 border border-white/5 rounded-xl py-3 px-4 text-xs outline-none focus:border-primary/30 transition-all ${errors.dbUrl ? 'border-red-500/50 focus:border-red-500' : 'border-white/10'}`}
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[8px] font-black text-white/10 uppercase flex gap-2">
                                    {/* <span>IMDb</span> */}
                                    <span>TMDB</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onToggleManual}
                        className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2
                            ${
                                showManual
                                    ? 'bg-white/10 border-white/20 text-white'
                                    : 'bg-transparent border-white/5 text-white/30 hover:border-white/10 hover:text-white/50'
                            }`}
                    >
                        {showManual ? 'Hide Manual Fields' : 'Manual Entry'}
                    </button>
                </div>
            </div>

            {progress !== null && (
                <div className="w-full p-2 animate-in fade-in slide-in-from-top-2 duration-300">
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
            )}
        </section>
    );
}

type CombinedProps = InputHTMLAttributes<HTMLInputElement> & TextareaHTMLAttributes<HTMLTextAreaElement>;
interface FormInputProps extends CombinedProps {
    label: string;
    elementType?: 'input' | 'textarea';
    error?: { message?: string };
}
export const FormInput = forwardRef<HTMLInputElement | HTMLTextAreaElement, FormInputProps>(
    ({ label, elementType = 'input', error, ...props }, ref) => {
        const Tag = elementType;

        return (
            <div className={elementType === 'textarea' ? 'md:col-span-2' : ''}>
                <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-black mb-2 block">{label}</label>
                    {error && (
                        <p className="text-red-500 text-[10px] mb-2 font-bold animate-in fade-in slide-in-from-right-1">{error.message}</p>
                    )}
                </div>

                <Tag
                    {...props}
                    ref={ref as never}
                    className={`w-full bg-white/5 border rounded-xl px-4 py-3.5 outline-none text-sm transition-all resize-none
                        ${error ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:bg-white/10 focus:border-white/20'}`}
                />
            </div>
        );
    }
);

FormInput.displayName = 'FormInput';
