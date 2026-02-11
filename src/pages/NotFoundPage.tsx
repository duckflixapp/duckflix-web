import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Rocket, Compass } from 'lucide-react';

export default function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center overflow-hidden relative">
            {/* AMBIENT BACKGROUND ELEMENTS */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-1/4 right-1/4 w-75 h-75 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

            {/* Animisane zvezde (suptilno) */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 pointer-events-none" />

            <h1 className="text-[200px] md:text-[300px] font-black text-white/3 leading-none absolute select-none tracking-tighter italic">
                404
            </h1>

            {/* GLOSSY CARD */}
            <div className="relative z-10 backdrop-blur-xs bg-white/1 border border-white/10 p-10 md:p-16 rounded-[40px] shadow-2xl max-w-2xl mx-auto overflow-hidden group">
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/30 rounded-full blur-[60px] group-hover:bg-primary/50 transition-all duration-700" />

                <div className="mb-6 inline-flex p-4 bg-primary/10 rounded-2xl text-primary">
                    <Rocket size={40} strokeWidth={1.5} />
                </div>

                <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                    Lost in the <span className="text-primary">Void?</span>
                </h2>

                <p className="text-text/60 text-lg max-w-md mb-10 leading-relaxed">
                    The content you are trying to access is currently unavailable. Please check the URL or return to the home page to
                    continue watching.
                </p>
                {/* BUTTONS */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-20">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center justify-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/10 transition-all duration-300 backdrop-blur-md group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium">Abort Mission</span>
                    </button>

                    <button
                        onClick={() => navigate('/browse')}
                        className="flex items-center justify-center gap-3 px-8 py-4 bg-primary cursor-pointer hover:bg-primary/90 text-background font-medium rounded-2xl shadow-[0_0_20px_rgba(var(--primary-color),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary-color),0.5)] transition-all duration-300"
                    >
                        <Compass size={20} />
                        <span>Return to Base</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
