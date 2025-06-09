'use client';

import React, { useEffect } from 'react';
import GameBoard, { Cell } from '../../components/gameBoard';
import  {useTetris}  from '../../tetris/useTetris';

export default function TetrisPage() {
  const {
    board,
    currentPiece,
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
  } = useTetris();

  // Auto drop the piece every 500ms when game is running
  useEffect(() => {
    if (!gameRunning) return;

    const interval = setInterval(() => {
      moveDown();
    }, 500);

    return () => clearInterval(interval);
  }, [gameRunning, moveDown]);

  // Keyboard controls
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

  // Merge current piece onto the board for rendering
  const mergedBoard: Cell[][] = board.map((row: Cell[]) => row.slice());

  if (currentPiece) {
    const { shape, row, col, color } = currentPiece;
    shape.forEach((r: number[], y: number) => {
      r.forEach((cell: number, x: number) => {
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
      });
    });
  }

  return (
    <div className="flex flex-col items-center p-4 min-h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-4">Tetris</h1>

      <div className="mb-4 flex gap-4">
        <button
          onClick={gameRunning ? resetGame : startGame}
          className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition"
        >
          {gameRunning ? 'Restart' : 'Start'}
        </button>
      </div>

      <GameBoard board={mergedBoard} />

      <div className="mt-4 space-x-6">
        <span>Score: {score}</span>
        <span>Best: {bestScore}</span>
        <span>Lines: {linesCleared}</span>
      </div>

      {gameOver && (
        <div className="mt-4 text-red-500 font-bold text-xl">
          Game Over!
        </div>
      )}

      <p className="mt-6 text-gray-400 text-sm max-w-md text-center">
        Use arrow keys to move, up arrow to rotate, space to drop instantly.
      </p>
    </div>
  );
}
