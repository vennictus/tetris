'use client';
import Link from "next/link";
import { useState, useEffect } from "react";

const bgShapes = [
  [
    [1, 1, 1],
    [0, 1, 0],
  ],
  [
    [1, 1],
    [1, 1],
  ],
  [
    [0, 1, 1],
    [1, 1, 0],
  ],
  [
    [1, 1, 0],
    [0, 1, 1],
  ],
];

export default function Home() {
  const [fallingShapes, setFallingShapes] = useState<number[][][]>([]);

  // Generate background falling blocks only on the client
  useEffect(() => {
    setFallingShapes(
      [...Array(15)].map(() => bgShapes[Math.floor(Math.random() * bgShapes.length)])
    );
  }, []);

  return (
    <main className="relative min-h-screen bg-black text-white flex flex-col items-center justify-center gap-8 overflow-hidden font-mono select-none">

      {/* Falling Background Shapes */}
      <div aria-hidden className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {fallingShapes.map((shape: number[][], i: number) => (
          <div
            key={i}
            className="absolute w-12 h-12 opacity-30"
            style={{
              left: `${(i * 7) % 100}%`,
              animation: 'fall 10s linear infinite',
              animationDelay: `${(i * 700) % 10000}ms`,
            }}
          >
            <div className="grid grid-cols-3 grid-rows-2 gap-[1px]">
              {shape.flatMap((row: number[], y: number) =>
                row.map((filled: number, x: number) => (
                  <div
                    key={`${y}-${x}`}
                    className={`w-3 h-3 rounded-sm transition-colors duration-200 
                      ${filled ? 'bg-blue-500 hover:bg-blue-400' : 'bg-transparent hover:bg-blue-200/30'}`}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pulsing Blue Sun + Logo */}
      <div aria-hidden className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="relative flex flex-col items-center">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] bg-blue-500 rounded-full blur-[180px] opacity-40 animate-pulse-slow"></div>
          </div>
          <div aria-hidden="true" className="text-blue-300 text-[10vw] sm:text-[8rem] font-extrabold tracking-widest opacity-80 drop-shadow-[0_0_60px_#3b82f6cc] animate-pulse-fast">
            MLSC TETRIS
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="z-10 flex flex-col items-center gap-8 text-center px-4 max-w-lg">
        <h1 className="text-6xl font-extrabold tracking-widest text-blue-400 drop-shadow-lg">
          MLSC TETRIS
        </h1>
        <p className="text-lg text-gray-100 bg-black/69 p-6 rounded-lg leading-relaxed shadow-lg">
          It’s Tetris — surely you know what to do!
          <br />
          Use the arrow keys to move and rotate the pieces, and try to clear as many lines as possible.
          <br />
          Good luck!
          <br />
          <span className="italic text-blue-300">(Keyboard only for now)</span>
        </p>
        <Link
          href="/tetris"
          className="bg-blue-600 hover:bg-blue-700 hover:shadow-[0_0_20px_#3b82f6] text-white px-8 py-3 rounded-3xl text-lg transition shadow-lg border border-blue-800"
        >
          ▶ Start Game
        </Link>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 text-sm text-blue-400 z-10">
        Built by Vennictus - MLSC • 2025
      </footer>

      {/* Animations */}
      <style jsx>{`
        @keyframes pulse-fast {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.9; }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.4; }
        }
        @keyframes fall {
          0% { transform: translateY(-10%); }
          100% { transform: translateY(110vh); }
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
