'use client';

import React, { useEffect, useState } from 'react';
import GameBoard, { Cell } from '../../components/gameBoard';
import { useTetris } from '../../tetris/useTetris';

function MiniPiece({ shape, color }: { shape: number[][]; color: string }) {
  return (
    <div className="grid grid-cols-4 grid-rows-4 gap-[1px] w-16 h-16 bg-black p-1 rounded shadow-inner border border-red-700">
      {Array.from({ length: 16 }).map((_, idx) => {
        const x = idx % 4;
        const y = Math.floor(idx / 4);
        const filled = shape[y]?.[x];
        return (
          <div
            key={idx}
            className={`w-full h-full rounded ${filled ? color : 'bg-[#0a0a0a]'}`}
          />
        );
      })}
    </div>
  );
}

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

export default function TetrisPage() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  const {
    board,
    currentPiece,
    ghostPiece,
    nextPieces,
    moveLeft,
    moveRight,
    moveDown,
    rotate,
    drop,
    resetGame,
    startGame,
    gameOver,
    gameRunning,
    score,
    bestScore,
    linesCleared,
    resetHighScore,
  } = useTetris();

  useEffect(() => {
    if (!gameRunning) return;
    const interval = setInterval(moveDown, 500);
    return () => clearInterval(interval);
  }, [gameRunning, moveDown]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!gameRunning || gameOver) return;
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          moveLeft();
          break;
        case 'ArrowRight':
          e.preventDefault();
          moveRight();
          break;
        case 'ArrowDown':
          e.preventDefault();
          moveDown();
          break;
        case 'ArrowUp':
          e.preventDefault();
          rotate();
          break;
        case ' ':
          e.preventDefault();
          drop();
          break;
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveLeft, moveRight, moveDown, rotate, drop, gameRunning, gameOver]);

  if (!hydrated) return <main className="min-h-screen bg-black" />;

  const mergedBoard: Cell[][] = board.map(row => [...row]);
  if (currentPiece) {
    const { shape, row, col, color } = currentPiece;
    shape.forEach((r, y) =>
      r.forEach((cell, x) => {
        if (cell) {
          const boardRow = row + y;
          const boardCol = col + x;
          if (
            boardRow >= 0 &&
            boardRow < mergedBoard.length &&
            boardCol >= 0 &&
            boardCol < mergedBoard[0].length
          ) {
            mergedBoard[boardRow][boardCol] = {
              filled: true,
              color,
            };
          }
        }
      })
    );
  }

  return (
    <main className="relative min-h-screen flex flex-col justify-center items-center bg-black text-white overflow-hidden font-mono select-none">
      {/* Falling Background Shapes */}
      <div aria-hidden className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {[...Array(15)].map((_, i) => {
          const shape = bgShapes[Math.floor(Math.random() * bgShapes.length)];
          return (
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
                {shape.flatMap((row, y) =>
                  row.map((filled, x) => (
                    <div
                      key={`${y}-${x}`}
                      className="w-3 h-3 rounded-sm bg-red-600"
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid + Flicker Effects */}
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(#3a0000_1px,transparent_1px)] bg-[size:18px_18px] opacity-10 z-0 pointer-events-none" />
      <div aria-hidden className="absolute inset-0 bg-black opacity-[0.05] mix-blend-screen animate-flicker pointer-events-none z-0" />

      {/* Pulsing Red Sun + TETRIS Logo */}
      <div className="absolute z-0 inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative">
          <div className="absolute inset-0 w-[500px] h-[500px] bg-red-700 rounded-full blur-[160px] opacity-30 animate-pulse-slow"></div>
          <div className="text-red-500 text-[12rem] font-extrabold tracking-widest opacity-60 drop-shadow-[0_0_50px_#ff0000cc] animate-pulse">
            TETRIS
          </div>
        </div>
      </div>

      {/* Main UI */}
      <div className="z-10 flex gap-12 items-center justify-center p-8 mt-16">
        <section className="flex flex-col items-center gap-6 w-56 h-72 bg-black rounded-3xl p-6 shadow-[0_0_12px_#550000] border border-red-700">
          <h2 className="text-xl font-bold text-red-500 tracking-wider">Next</h2>
          <div className="flex flex-col gap-4">
            {gameRunning && nextPieces.length > 0 ? (
              nextPieces.slice(0, 2).map((piece, idx) => (
                <MiniPiece key={idx} shape={piece.shape} color={piece.color} />
              ))
            ) : (
              <>
                <div className="w-16 h-16 bg-[#0a0a0a] border border-red-800 rounded" />
                <div className="w-16 h-16 bg-[#0a0a0a] border border-red-800 rounded" />
              </>
            )}
          </div>
        </section>

        <section className="bg-black p-2 rounded-xl shadow-[0_0_20px_#ff000055] border-2 border-red-800">
          <GameBoard board={mergedBoard} ghostPiece={ghostPiece} />
        </section>

        <section className="flex flex-col items-center justify-between gap-8 w-56 min-h-[320px] bg-black rounded-3xl p-6 shadow-[0_0_12px_#550000] border border-red-700">
          <div className="flex flex-col gap-4 text-center">
            <p className="text-lg">
              Score: <span className="font-bold text-red-500">{score}</span>
            </p>
            <p className="text-lg">
              Best: <span className="font-bold text-red-500">{bestScore}</span>
            </p>
            <p className="text-lg">
              Lines: <span className="font-bold text-red-500">{linesCleared}</span>
            </p>
          </div>

          <div className="flex flex-col gap-4 w-full">
            <button
              onClick={gameRunning ? resetGame : startGame}
              className="w-full px-6 py-3 bg-red-700 rounded-3xl font-semibold text-white hover:bg-red-800 transition shadow-md"
            >
              {gameRunning ? 'Restart' : 'Start'}
            </button>
            <button
              onClick={resetHighScore}
              className="w-full px-6 py-3 bg-[#1a1a1a] rounded-3xl font-semibold text-red-400 hover:text-red-500 border border-red-800 transition"
            >
              Reset High Score
            </button>
          </div>
        </section>
      </div>

      {/* Game Over + Start Overlays */}
      {gameOver && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 text-red-600 text-5xl font-extrabold tracking-widest drop-shadow-md animate-flicker pulse">
          GAME OVER!!
        </div>
      )}
      {!gameRunning && !gameOver && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 text-red-600 text-4xl font-bold tracking-wider animate-flicker pulse">
          PRESS START TO PLAY!!
        </div>
      )}
        {gameRunning && !gameOver && (
            <div className="absolute top-10 left-1/2 -translate-x-1/2 text-green-400 text-3xl font-bold tracking-wider animate-flicker">
                GAME ON!
            </div>
        )}
      {/* Instructions */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm text-red-400 flex gap-6 tracking-wide bg-black/30 px-4 py-2 rounded-full border border-red-700 shadow-[0_0_10px_#550000] backdrop-blur-md">
        <span>⬅️ ➡️ Move</span>
        <span>⬆️ Rotate</span>
        <span>⬇️ Soft Drop</span>
        <span>⎵ Hard Drop</span>
      </div>

      {/* Styles */}
      <style jsx>{`
        @keyframes flicker {
          0%, 100% { opacity: 0.05; }
          50% { opacity: 0.1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.4; }
        }
        @keyframes fall {
          0% { transform: translateY(-10%); }
          100% { transform: translateY(110vh); }
        }
        .animate-flicker {
          animation: flicker 3s linear infinite;
        }
        .pulse {
          animation: pulse 4s ease-in-out infinite;
        }
        .pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
      `}</style>
    </main>
  );
}
