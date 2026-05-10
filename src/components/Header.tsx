export default function Header({ title, desc }: { title: string; desc?: string }) {
    return (
        <header className="flex flex-col items-center pb-6">
            <h1 className="text-3xl font-black tracking-tight text-white">{title}</h1>
            {desc && <p className="text-text/40 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">{desc}</p>}
        </header>
    );
}
