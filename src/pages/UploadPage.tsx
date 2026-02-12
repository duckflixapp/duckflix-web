import { Upload, Link, FileIcon, X, Check } from 'lucide-react';
import { forwardRef, useCallback, useState, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDropzone } from 'react-dropzone';
import { formatBytes } from '../utils/format';
import { getMagnetFromTorrentFile } from '../utils/torrent';
import { createMovieSchema, type MovieFormValues } from '../schemas/movie';
import { useGenres } from '../hooks/use-genres';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import type { MovieDTO } from '@duckflix/shared';

export default function UploadPage() {
    const { data: genres } = useGenres();
    const [file, setFile] = useState<File | null>(null);
    const [magnet, setMagnet] = useState<string>('');
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
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
            description: '',
            genreIds: [],
        },
    });

    const selectedGenreIds = useWatch({
        control,
        name: 'genreIds',
        defaultValue: [],
    });

    const onSubmit = async (values: MovieFormValues) => {
        if (!file && !magnet) {
            alert('Please upload a video file or provide a magnet link.');
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

        if (file) formData.append('video', file);
        if (magnet) formData.append('magnet', magnet);

        const data = await api
            .post<{ movie: MovieDTO }>('/movies/upload', formData as never, {
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total!);
                    setUploadProgress(percentCompleted);
                },
            })
            .catch((err) => {
                console.error('Upload error:', err);
                alert('error while uploading');
            });

        if (data) navigate(`/details/${data.movie.id}`);
    };

    const changeFile = (file: File | null) => setFile(file);
    const changeMagnet = (magnet: string) => setMagnet(magnet);

    return (
        <div className="w-full xl:pr-56 transition-all duration-300">
            <form onSubmit={handleSubmit(onSubmit)} className="max-w-5xl w-full mx-auto py-6 px-8 md:py-12 text-white space-y-6">
                <header className="mb-4">
                    <h1 className="text-2xl font-black tracking-tight">Upload Video</h1>
                </header>
                <UploadSection
                    progress={uploadProgress}
                    file={file}
                    magnet={magnet}
                    onFileChange={changeFile}
                    onMagnetChange={changeMagnet}
                />
                <section className="bg-white/5 border border-white/10 rounded-4xl p-8 md:p-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                        <FormInput
                            label="Movie Title"
                            error={errors.title}
                            placeholder="Star Wars: Revenge of the Sith"
                            {...register('title')}
                        />
                        <FormInput
                            elementType="textarea"
                            label="Description"
                            error={errors.description}
                            placeholder="Brief summary..."
                            {...register('description')}
                        />

                        <div className="space-y-6">
                            <FormInput label="Poster URL" error={errors.posterUrl} placeholder="https://..." {...register('posterUrl')} />
                            <FormInput
                                label="Release Year"
                                error={errors.releaseYear}
                                placeholder="e.g. 1983"
                                {...register('releaseYear')}
                            />
                        </div>

                        <div className="space-y-6">
                            <FormInput label="Banner URL" error={errors.bannerUrl} placeholder="https://..." {...register('bannerUrl')} />

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
                                            const isSelected = selectedGenreIds.includes(genre.id);
                                            return (
                                                <button
                                                    key={genre.id}
                                                    type="button"
                                                    onClick={() => {
                                                        const nextValue = isSelected
                                                            ? selectedGenreIds.filter((id) => id !== genre.id)
                                                            : [...selectedGenreIds, genre.id];

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

                    <div className="mt-10 pt-4 border-t border-white/5 flex justify-end">
                        <button
                            type="submit"
                            className="w-full md:w-auto px-12 py-4 cursor-pointer bg-primary text-black font-black rounded-xl transition-all uppercase tracking-[0.2em] text-xs shadow-lg shadow-primary/10"
                        >
                            Upload
                        </button>
                    </div>
                </section>
            </form>
        </div>
    );
}

function UploadSection({
    file,
    magnet,
    progress,
    onFileChange: changeFile,
    onMagnetChange: changeMagnet,
}: {
    file: File | null;
    magnet: string;
    progress: number | null;
    onFileChange: (file: File | null) => void;
    onMagnetChange: (uri: string) => void;
}) {
    const [isTorrentParsed, setIsTorrentParsed] = useState(false);

    const onDrop = useCallback(
        async (acceptedFiles: File[]) => {
            const droppedFile = acceptedFiles[0];
            if (!droppedFile) return;

            if (droppedFile.name.endsWith('.torrent')) {
                const mangetURI = await getMagnetFromTorrentFile(droppedFile);
                changeMagnet(mangetURI ?? '');
                setIsTorrentParsed(true);
                changeFile(null);
            } else {
                changeFile(droppedFile);
                changeMagnet('');
                setIsTorrentParsed(false);
            }
        },
        [changeFile, changeMagnet]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxFiles: 1,
        accept: {
            'video/*': ['.mp4', '.mkv', '.avi'],
            'application/x-bittorrent': ['.torrent'],
        },
    });

    const onRemoveFile = () => changeFile(null);
    const onMagnetChange = (value: string) => {
        changeMagnet(value);
        setIsTorrentParsed(false);
        if (value) changeFile(null);
    };

    const fileSize = file ? formatBytes(file.size) : null;

    return (
        <section className="bg-white/5 border border-white/10 rounded-4xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col items-center gap-6">
                <div
                    {...getRootProps()}
                    className={`flex-1 w-full border-2 border-dashed rounded-2xl p-6 flex items-center gap-4 transition-all cursor-pointer group
                            ${isDragActive ? 'border-primary bg-primary/5' : 'border-white/10 hover:bg-white/2'}`}
                >
                    <input {...getInputProps()} />

                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        {file ? <FileIcon className="text-primary" size={24} /> : <Upload className="text-primary" size={24} />}
                    </div>

                    <div className="text-left flex-1">
                        {file ? (
                            <>
                                <h2 className="font-bold text-sm text-primary truncate max-w-50">{file.name}</h2>
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
                        <button onClick={onRemoveFile} className="p-2 hover:bg-white/10 rounded-lg text-white/20 hover:text-white">
                            <X size={16} />
                        </button>
                    )}
                </div>

                <div className="flex-[1.2] w-full space-y-3">
                    <div className="flex items-center justify-between ml-1">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
                            <Link size={12} />
                            <span>Or paste magnet</span>
                        </div>

                        {isTorrentParsed && (
                            <div className="flex items-center gap-1 text-primary animate-in fade-in zoom-in duration-300">
                                <Check size={12} strokeWidth={2} />
                                <span className="text-[10px]">Parsed</span>
                            </div>
                        )}
                    </div>

                    <div className="relative group">
                        <input
                            type="text"
                            value={magnet}
                            onChange={(e) => onMagnetChange(e.target.value)}
                            placeholder="magnet:?xt=urn:btih:..."
                            className={`w-full bg-black/40 border rounded-xl py-3 px-4 text-xs font-mono outline-none transition-all
                                        ${
                                            isTorrentParsed
                                                ? 'border-primary/50 text-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]'
                                                : 'border-white/5 focus:border-primary/40 text-primary'
                                        }`}
                        />
                    </div>
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
