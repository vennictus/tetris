'use client';
import Link from "next/link";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-black text-white flex flex-col items-center justify-center gap-8 overflow-hidden font-mono select-none">
      {/* Red Sun Background */}
      <div aria-hidden className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="relative">
          <div className="absolute inset-0 w-[500px] h-[500px] bg-red-700 rounded-full blur-[160px] opacity-30 animate-pulse-slow"></div>
          <div className="text-red-500 text-[12rem] font-extrabold tracking-widest opacity-60 drop-shadow-[0_0_50px_#ff0000cc] animate-pulse">
            TETRIS
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="z-10 flex flex-col items-center gap-6 text-center px-4">
        <h1 className="text-6xl font-extrabold tracking-widest text-red-500 drop-shadow-lg">
          TETRIS
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
          className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-3xl text-lg transition-all shadow-lg border border-red-800"
        >
          ▶ Start Game
        </Link>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 text-sm text-red-400 z-10">
        Built by Vennictus • 2025
      </footer>

      {/* Extra Styles */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.4; }
        }
        .animate-pulse {
          animation: pulse 4s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
      `}</style>
    </main>
  );
}
