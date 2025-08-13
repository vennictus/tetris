'use client';
import Link from "next/link";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-black text-white flex flex-col items-center justify-center gap-8 overflow-hidden font-mono select-none">
      
      {/* Pulsing Blue Sun + MLSC TETRIS Logo */}
      <div aria-hidden className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="relative flex flex-col items-center">
          {/* Glowing Blue Sun (Responsive) */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] bg-blue-500 rounded-full blur-[180px] opacity-40 animate-pulse-slow"></div>
          </div>

          {/* Logo Text */}
          <div className="text-blue-300 text-[10vw] sm:text-[8rem] font-extrabold tracking-widest opacity-80 drop-shadow-[0_0_60px_#3b82f6cc] animate-pulse-fast">
            MLSC TETRIS
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="z-10 flex flex-col items-center gap-6 text-center px-4">
        <h1 className="text-6xl font-extrabold tracking-widest text-blue-400 drop-shadow-lg">
          MLSC TETRIS
        </h1>
        <p className="text-lg text-gray-300 max-w-md">
          It’s Tetris — surely you know what to do!
          <br />
          Use the arrow keys to move and rotate the pieces, and try to clear as many lines as possible.
          <br />
          Good luck!
          <br />
          (Keyboard only for now)
        </p>
        <Link
          href="/tetris"
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-3xl text-lg transition-all shadow-lg border border-blue-800"
        >
          ▶ Start Game
        </Link>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 text-sm text-blue-400 z-10">
        Built by Vennictus - MLSC • 2025
      </footer>

      {/* Extra Styles */}
      <style jsx>{`
        @keyframes pulse-fast {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.9; }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.4; }
        }
        .animate-pulse-fast {
          animation: pulse-fast 3s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
      `}</style>
    </main>
  );
}
