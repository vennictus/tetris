import React from "react";

// Constants for the game board dimensions
const ROWS = 20;
const COLUMNS = 10;

export type Cell = {
  filled: boolean;
  color: string;
};

type GameBoardProps = {
  board: Cell[][];
  ghostPiece?: {
    shape: number[][];
    row: number;
    col: number;
    color: string;
  } | null;
};

export default function GameBoard({ board, ghostPiece = null }: GameBoardProps) {
  // Create a copy of the board for rendering with ghost piece overlay
  const renderBoard = board.map(row => row.slice());

  if (ghostPiece) {
    const { shape, row: ghostRow, col: ghostCol, color } = ghostPiece;

    shape.forEach((r, y) => {
      r.forEach((cell, x) => {
        if (cell) {
          const boardRow = ghostRow + y;
          const boardCol = ghostCol + x;
          if (
            boardRow >= 0 &&
            boardRow < ROWS &&
            boardCol >= 0 &&
            boardCol < COLUMNS &&
            !renderBoard[boardRow][boardCol].filled
          ) {
            // Mark the ghost piece cell with a special color and opacity
            renderBoard[boardRow][boardCol] = {
              filled: true,
              // Use tailwind classes for opacity with bg color - fallback to color with opacity style
              color: `${color} opacity-40`,
            };
          }
        }
      });
    });
  }

  return (
    <div className="grid grid-rows-20 grid-cols-10 w-[200px] h-[400px] border-2 border-white">
      {renderBoard.flat().map((cell, index) => (
        <div
          key={index}
          className={`w-full h-full border border-gray-700 ${cell.color}`}
        />
      ))}
    </div>
  );
}
