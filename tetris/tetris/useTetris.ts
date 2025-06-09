import { useState, useEffect, useRef } from 'react';
import { TETROMINOES } from './tetrominoes';

const ROWS = 20;
const COLS = 10;

export type Cell = {
  filled: boolean;
  color: string;
};

type CurrentPiece = {
  shape: number[][];
  color: string;
  row: number;
  col: number;
  rotationIndex: number;
  tetrominoKey: string;
};

export function useTetris() {
  // Board state
  const [board, setBoard] = useState<Cell[][]>(createEmptyBoard());

  // Current piece, lazy initialize as null then set in useEffect
  const [currentPiece, setCurrentPiece] = useState<CurrentPiece | null>(null);

  // Game state flags
  const [gameRunning, setGameRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  // Score states
  const [score, setScore] = useState(0);
  const [linesCleared, setLinesCleared] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    if (typeof window !== "undefined") {
      return Number(localStorage.getItem("bestScore") ?? 0);
    }
    return 0;
  });

  // Lock delay timer ref
  const lockDelayTimeout = useRef<NodeJS.Timeout | null>(null);

  // Gravity interval ref
  const gravityInterval = useRef<NodeJS.Timeout | null>(null);

  // Initialize current piece on mount or game reset
  useEffect(() => {
    setCurrentPiece(getRandomPiece());
  }, []);

  // Helper functions

  function createEmptyBoard(): Cell[][] {
    return Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => ({ filled: false, color: '' }))
    );
  }

  function getRandomPiece(): CurrentPiece {
    const tetrominoKeys = Object.keys(TETROMINOES);
    const tetrominoKey = tetrominoKeys[Math.floor(Math.random() * tetrominoKeys.length)];
    const rotationIndex = 0;
    const tetromino = TETROMINOES[tetrominoKey][rotationIndex];

    // Defensive check for shape array
    if (!tetromino || !tetromino.shape || !Array.isArray(tetromino.shape)) {
      throw new Error(`Invalid tetromino shape for key ${tetrominoKey}`);
    }

    // Center the piece horizontally
    const col = Math.floor((COLS - tetromino.shape[0].length) / 2);

    return {
      shape: tetromino.shape,
      color: tetromino.color,
      row: 0,
      col,
      rotationIndex,
      tetrominoKey,
    };
  }

  function checkCollision(shape: number[][], row: number, col: number): boolean {
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const boardRow = row + y;
          const boardCol = col + x;
          if (
            boardRow < 0 ||
            boardRow >= ROWS ||
            boardCol < 0 ||
            boardCol >= COLS ||
            (board[boardRow] && board[boardRow][boardCol] && board[boardRow][boardCol].filled)
          ) {
            return true;
          }
        }
      }
    }
    return false;
  }

  function clearRows(board: Cell[][]): { clearedBoard: Cell[][]; clearedCount: number } {
    const newBoard = board.filter((row) => !row.every((cell) => cell.filled));
    const clearedCount = ROWS - newBoard.length;
    while (newBoard.length < ROWS) {
      newBoard.unshift(Array.from({ length: COLS }, () => ({ filled: false, color: '' })));
    }
    return { clearedBoard: newBoard, clearedCount };
  }

  // Move down with lock delay logic
  function moveDownWithLockDelay() {
    if (!gameRunning || gameOver || !currentPiece) return;

    const { shape, row, col } = currentPiece;

    if (!checkCollision(shape, row + 1, col)) {
      if (lockDelayTimeout.current) {
        clearTimeout(lockDelayTimeout.current);
        lockDelayTimeout.current = null;
      }
      setCurrentPiece({ ...currentPiece, row: row + 1 });
    } else {
      if (!lockDelayTimeout.current) {
        lockDelayTimeout.current = setTimeout(() => {
          lockPiece();
          lockDelayTimeout.current = null;
        }, 500); // 500ms lock delay
      }
    }
  }

  // Lock the piece into the board
  function lockPiece() {
    if (!currentPiece) return;

    const { shape, row, col, color } = currentPiece;
    const newBoard = board.map(r => r.slice());

    shape.forEach((r, y) => {
      r.forEach((cell, x) => {
        if (cell) {
          const boardRow = row + y;
          const boardCol = col + x;
          if (boardRow >= 0 && boardRow < ROWS && boardCol >= 0 && boardCol < COLS) {
            newBoard[boardRow][boardCol] = { filled: true, color };
          }
        }
      });
    });

    const { clearedBoard, clearedCount } = clearRows(newBoard);
    setBoard(clearedBoard);

    if (clearedCount > 0) {
      const points = clearedCount * 100;
      setScore(prev => {
        const newScore = prev + points;
        if (newScore > bestScore) {
          setBestScore(newScore);
          if (typeof window !== "undefined") {
            localStorage.setItem("bestScore", newScore.toString());
          }
        }
        return newScore;
      });
      setLinesCleared(prev => prev + clearedCount);
    }

    const nextPiece = getRandomPiece();

    if (checkCollision(nextPiece.shape, nextPiece.row, nextPiece.col)) {
      setGameOver(true);
      setGameRunning(false);
    } else {
      setCurrentPiece(nextPiece);
    }
  }

  function resetLockDelay() {
    if (lockDelayTimeout.current) {
      clearTimeout(lockDelayTimeout.current);
      lockDelayTimeout.current = null;
    }
  }

  function moveDown() {
    if (!gameRunning || gameOver || !currentPiece) return;

    const { shape, row, col } = currentPiece;

    if (!checkCollision(shape, row + 1, col)) {
      resetLockDelay();
      setCurrentPiece({ ...currentPiece, row: row + 1 });
    } else {
      lockPiece();
    }
  }

  function moveLeft() {
    if (!gameRunning || gameOver || !currentPiece) return;

    const { shape, row, col } = currentPiece;

    if (!checkCollision(shape, row, col - 1)) {
      resetLockDelay();
      setCurrentPiece({ ...currentPiece, col: col - 1 });
    }
  }

  function moveRight() {
    if (!gameRunning || gameOver || !currentPiece) return;

    const { shape, row, col } = currentPiece;

    if (!checkCollision(shape, row, col + 1)) {
      resetLockDelay();
      setCurrentPiece({ ...currentPiece, col: col + 1 });
    }
  }

  function rotate() {
    if (!gameRunning || gameOver || !currentPiece) return;

    const { tetrominoKey, rotationIndex, row, col } = currentPiece;
    const nextIndex = (rotationIndex + 1) % 4;
    const nextShape = TETROMINOES[tetrominoKey][nextIndex].shape;

    if (!checkCollision(nextShape, row, col)) {
      resetLockDelay();
      setCurrentPiece({
        ...currentPiece,
        shape: nextShape,
        rotationIndex: nextIndex,
      });
    }
  }

  function drop() {
    if (!gameRunning || gameOver || !currentPiece) return;

    let { shape, row, col } = currentPiece;
    while (!checkCollision(shape, row + 1, col)) {
      row++;
    }
    setCurrentPiece({ ...currentPiece, row });
    lockPiece();
  }

  function startGame() {
    setBoard(createEmptyBoard());
    setCurrentPiece(getRandomPiece());
    setScore(0);
    setLinesCleared(0);
    setGameOver(false);
    setGameRunning(true);
    resetLockDelay();
  }

  const resetGame = startGame;

  return {
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
  };
}
