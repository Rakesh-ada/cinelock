import Link from "next/link";

export default function Footer() {
    return (
        <footer className="py-8 md:py-10 border-t border-white/5 bg-transparent text-gray-500 text-sm">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
                <div className="flex flex-col items-center md:items-start">
                    <span className="text-white font-display font-bold text-base md:text-lg mb-1">Cinelock</span>
                    <p className="text-xs md:text-sm">2026 Cinelock AI Inc.</p>
                </div>

                <div className="flex gap-6 md:gap-8 text-xs md:text-sm">
                    <Link href="#" className="hover:text-white transition-colors duration-200">Privacy</Link>
                    <Link href="#" className="hover:text-white transition-colors duration-200">Terms</Link>
                    <Link href="#" className="hover:text-white transition-colors duration-200">Twitter</Link>
                </div>
            </div>
        </footer>
    );
}
