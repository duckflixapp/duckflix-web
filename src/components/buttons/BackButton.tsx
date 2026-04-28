import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BackButtonProps {
    to?: string;
    label?: string;
}

export function BackButton({ to, label }: BackButtonProps) {
    const navigate = useNavigate();

    const handleClick = () => (to ? navigate(to) : navigate(-1));

    return (
        <button
            onClick={handleClick}
            className="flex items-center gap-2 text-white/75 hover:text-white/90 transition-colors cursor-pointer group"
        >
            <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            {label && <span>{label}</span>}
        </button>
    );
}
