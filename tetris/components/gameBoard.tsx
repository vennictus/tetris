import React from "react";

// Constants for the game board dimensions
const ROWS = 20;
const COLUMNS = 10;

// Type definition for a cell in the game board
export type Cell = {
  filled: boolean;  // True if the cell is occupied by a block, false otherwise
  color: string;    // Tailwind CSS background color class for the cell
};

// Props type for GameBoard — it expects a 2D array of Cell objects
type GameBoardProps = {
  board: Cell[][];
};

// GameBoard component that renders the current state of the Tetris board
export default function GameBoard({ board }: GameBoardProps) {
  return (
    // Container div with CSS Grid layout: 20 rows, 10 columns, fixed size and border
    <div className="grid grid-rows-20 grid-cols-10 w-[200px] h-[400px] border-2 border-white">
      {/* Flatten the 2D board array into 1D and render each cell */}
      {board.flat().map((cell, index) => (
        <div
          key={index}  // React requires a unique key for each element in a list
          className={`
            w-full
            h-full
            border border-gray-700
            ${cell.color}
          `}
        />
      ))}
    </div>
  );
}
