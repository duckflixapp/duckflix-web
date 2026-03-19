import { useState } from 'react';
import { createPortal } from 'react-dom';

export default function CreateLibraryModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string) => void }) {
    const [name, setName] = useState('');

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/75" />
            <div
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-md bg-background/55 backdrop-blur-3xl border border-white/10 rounded-4xl p-8 shadow-2xl"
            >
                <h2 className="text-white font-bold text-lg mb-6">New Collection</h2>
                <div className="relative flex items-center">
                    <input
                        autoFocus
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && name.trim().length >= 2 && onCreate(name.trim())}
                        placeholder="Collection name"
                        maxLength={32}
                        className="w-full bg-white/5 border border-white/10 rounded-3xl px-4 pr-12 py-3 text-sm text-white outline-none focus:border-primary/50 placeholder:text-white/20"
                    />
                    <span className="absolute right-4 text-[10px] text-white/20">{name.length}/32</span>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm text-white/50 hover:text-white transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => name.trim().length >= 2 && onCreate(name.trim())}
                        disabled={name.trim().length < 2}
                        className="px-5 py-2.5 bg-primary text-background text-sm font-medium rounded-3xl disabled:opacity-40 cursor-pointer hover:bg-primary/80 transition-all"
                    >
                        Create
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
