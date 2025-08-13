import { useState, useEffect, useRef } from 'react';
import { TETROMINOES } from './tetrominoes';

const ROWS = 20;
const COLS = 10;

// ---- Types ----
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

// ---- Hook ----
export function useTetris() {
  // Visible state
  const [board, setBoard] = useState<Cell[][]>(createEmptyBoard());
  const [currentPiece, setCurrentPiece] = useState<CurrentPiece | null>(null);
  const [nextPieces, setNextPieces] = useState<CurrentPiece[]>([]);
  const [gameRunning, setGameRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [linesCleared, setLinesCleared] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [ghostPiece, setGhostPiece] = useState<CurrentPiece | null>(null);

  // Timing & difficulty
  const [dropInterval, setDropInterval] = useState(400); // ms
  const [elapsedTime, setElapsedTime] = useState(0); // seconds

  // ---- Refs to avoid stale closures inside intervals ----
  const boardRef = useRef<Cell[][]>(board);
  const currentPieceRef = useRef<CurrentPiece | null>(currentPiece);
  const nextPiecesRef = useRef<CurrentPiece[]>(nextPieces);
  const gameRunningRef = useRef<boolean>(gameRunning);
  const gameOverRef = useRef<boolean>(gameOver);
  const dropIntervalRef = useRef<number>(dropInterval);

  useEffect(() => { boardRef.current = board; }, [board]);
  useEffect(() => { currentPieceRef.current = currentPiece; }, [currentPiece]);
  useEffect(() => { nextPiecesRef.current = nextPieces; }, [nextPieces]);
  useEffect(() => { gameRunningRef.current = gameRunning; }, [gameRunning]);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);
  useEffect(() => { dropIntervalRef.current = dropInterval; }, [dropInterval]);

  // Load high score once
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedBest = localStorage.getItem('bestScore');
      if (storedBest) setBestScore(Number(storedBest));
    }
  }, []);

  // Start/initialize a new game when toggled on
  useEffect(() => {
    if (gameRunning && !gameOver) {
      const initialQueue: CurrentPiece[] = [];
      for (let i = 0; i < 3; i++) initialQueue.push(getRandomPiece());

      const first = initialQueue.shift()!;
      setBoard(createEmptyBoard());
      setScore(0);
      setLinesCleared(0);
      setNextPieces(initialQueue);
      setCurrentPiece(first);
      setElapsedTime(0);
      setDropInterval(400);
      setGameOver(false);
    }
  }, [gameRunning, gameOver]);

  // Ghost piece keeps in sync with visible state
  useEffect(() => {
    const cp = currentPieceRef.current;
    if (!cp) {
      setGhostPiece(null);
      return;
    }
    setGhostPiece(calculateGhostPiece(cp, boardRef.current));
  }, [currentPiece, board]);

  // ---- Gravity tick (SINGLE source of truth) ----
  useEffect(() => {
    if (!gameRunning || gameOver) return;

    const id = setInterval(() => {
      // Step down one row; if can't, it will lock
      stepDown();

      // Advance elapsed time in seconds based on the current interval
      setElapsedTime((prev) => {
        const next = prev + dropIntervalRef.current / 1000;
        if (next >= 150) {
          // Hard stop at 150s
          setGameOver(true);
          setGameRunning(false);
        }
        return next;
      });
    }, dropInterval);

    return () => clearInterval(id);
  }, [gameRunning, gameOver, dropInterval]);

  // ---- Difficulty ramp: speed up every 5s until 100ms ----
  useEffect(() => {
    if (!gameRunning || gameOver) return;

    const speedId = setInterval(() => {
      setDropInterval((prev) => Math.max(100, prev - 20));
    }, 5000);

    return () => clearInterval(speedId);
  }, [gameRunning, gameOver]);

  // =================== Core helpers ===================

  function createEmptyBoard(): Cell[][] {
    return Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => ({ filled: false, color: '' }))
    );
  }

  function getRandomPiece(): CurrentPiece {
    const keys = Object.keys(TETROMINOES);
    const tetrominoKey = keys[Math.floor(Math.random() * keys.length)];
    const rotationIndex = 0;
    const tet = TETROMINOES[tetrominoKey][rotationIndex];
    const col = Math.floor((COLS - tet.shape[0].length) / 2);

    return {
      shape: tet.shape,
      color: tet.color,
      row: 0,
      col,
      rotationIndex,
      tetrominoKey,
    };
  }

  function checkCollision(
    shape: number[][],
    row: number,
    col: number,
    boardArg?: Cell[][]
  ): boolean {
    const b = boardArg ?? boardRef.current;
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (!shape[y][x]) continue;
        const ry = row + y;
        const cx = col + x;
        if (
          ry < 0 ||
          ry >= ROWS ||
          cx < 0 ||
          cx >= COLS ||
          (b[ry] && b[ry][cx].filled)
        ) {
          return true;
        }
      }
    }
    return false;
  }

  function mergePieceToBoard(piece: CurrentPiece, boardArg: Cell[][]): Cell[][] {
    const nb = boardArg.map((r) => r.map((c) => ({ ...c })));
    piece.shape.forEach((r, y) => {
      r.forEach((cell, x) => {
        if (!cell) return;
        const ry = piece.row + y;
        const cx = piece.col + x;
        if (ry >= 0 && ry < ROWS && cx >= 0 && cx < COLS) {
          nb[ry][cx] = { filled: true, color: piece.color };
        }
      });
    });
    return nb;
  }

  function clearLines(boardArg: Cell[][]): { newBoard: Cell[][]; linesCleared: number } {
    const nb: Cell[][] = [];
    let cleared = 0;
    for (let r = 0; r < ROWS; r++) {
      if (boardArg[r].every((c) => c.filled)) {
        cleared++;
      } else {
        nb.push(boardArg[r]);
      }
    }
    // add empty rows on top
    for (let i = 0; i < cleared; i++) {
      nb.unshift(Array.from({ length: COLS }, () => ({ filled: false, color: '' })));
    }
    return { newBoard: nb, linesCleared: cleared };
  }

  function rotatePiece(piece: CurrentPiece): CurrentPiece {
    const rotations = TETROMINOES[piece.tetrominoKey];
    const nextIdx = (piece.rotationIndex + 1) % rotations.length;
    const nextShape = rotations[nextIdx].shape;

    if (!checkCollision(nextShape, piece.row, piece.col)) {
      return { ...piece, shape: nextShape, rotationIndex: nextIdx };
    }
    // simple wall kicks
    const kicks = [-1, 1, -2, 2];
    for (const k of kicks) {
      if (!checkCollision(nextShape, piece.row, piece.col + k)) {
        return { ...piece, shape: nextShape, col: piece.col + k, rotationIndex: nextIdx };
      }
    }
    return piece;
  }

  // =================== Public controls ===================

  function moveLeft() {
    const cp = currentPieceRef.current;
    if (!cp || gameOverRef.current) return;
    const newCol = cp.col - 1;
    if (!checkCollision(cp.shape, cp.row, newCol)) {
      const np = { ...cp, col: newCol };
      currentPieceRef.current = np;
      setCurrentPiece(np);
    }
  }

  function moveRight() {
    const cp = currentPieceRef.current;
    if (!cp || gameOverRef.current) return;
    const newCol = cp.col + 1;
    if (!checkCollision(cp.shape, cp.row, newCol)) {
      const np = { ...cp, col: newCol };
      currentPieceRef.current = np;
      setCurrentPiece(np);
    }
  }

  function rotate() {
    const cp = currentPieceRef.current;
    if (!cp || gameOverRef.current) return;
    const rotated = rotatePiece(cp);
    currentPieceRef.current = rotated;
    setCurrentPiece(rotated);
  }

  function drop() {
    const cp = currentPieceRef.current;
    if (!cp || gameOverRef.current) return;
    let dropRow = cp.row;
    while (!checkCollision(cp.shape, dropRow + 1, cp.col)) dropRow++;
    lockPiece({ ...cp, row: dropRow });
  }

  // Exposed moveDown for soft drop / ArrowDown
  function moveDown(): boolean {
    return stepDown();
  }

  // =================== Internal stepping & locking ===================

  function stepDown(): boolean {
    const cp = currentPieceRef.current;
    if (!cp || gameOverRef.current) return false;

    const newRow = cp.row + 1;
    if (!checkCollision(cp.shape, newRow, cp.col)) {
      const np = { ...cp, row: newRow };
      currentPieceRef.current = np;
      setCurrentPiece(np);
      return true;
    } else {
      lockPiece(cp);
      return false;
    }
  }

  function lockPiece(pieceToLock?: CurrentPiece) {
    const cp = pieceToLock ?? currentPieceRef.current;
    if (!cp) return;

    // Merge onto board
    const merged = mergePieceToBoard(cp, boardRef.current);
    const { newBoard, linesCleared: cleared } = clearLines(merged);

    // Update board + score
    boardRef.current = newBoard;
    setBoard(newBoard);
    if (cleared > 0) {
      setLinesCleared((prev) => prev + cleared);
      setScore((prev) => prev + calculateScore(cleared));
    } else {
      setScore((prev) => prev + 5);
    }

    // Ensure we always have at least 3 in queue
    let queue = [...nextPiecesRef.current];
    while (queue.length < 3) queue.push(getRandomPiece());

    // Pop next piece
    const next = queue.shift()!;
    nextPiecesRef.current = queue;
    setNextPieces(queue);

    // Place next piece
    currentPieceRef.current = next;
    setCurrentPiece(next);

    // If the new piece collides immediately -> game over
    if (checkCollision(next.shape, next.row, next.col, boardRef.current)) {
      setGameOver(true);
      setGameRunning(false);

      setBestScore((prevBest) => {
        const finalScore = (prevBest && score <= prevBest) ? prevBest : score;
        if (typeof window !== 'undefined') {
          localStorage.setItem('bestScore', String(finalScore));
        }
        return finalScore;
      });
    }
  }

  function calculateScore(lines: number): number {
    switch (lines) {
      case 1: return 100;
      case 2: return 300;
      case 3: return 500;
      case 4: return 800;
      default: return 0;
    }
  }

  function calculateGhostPiece(piece: CurrentPiece, b: Cell[][]): CurrentPiece {
    let ghostRow = piece.row;
    while (!checkCollision(piece.shape, ghostRow + 1, piece.col, b)) ghostRow++;
    return { ...piece, row: ghostRow };
  }

  // =================== Lifecycle controls ===================

  function startGame() {
    setElapsedTime(0);
    setDropInterval(400);
    setGameRunning(true);
    setGameOver(false);
  }

  function pauseGame() {
    setGameRunning(false);
  }

  function resetGame() {
    setElapsedTime(0);
    setDropInterval(400);
    setBoard(createEmptyBoard());
    setCurrentPiece(null);
    setNextPieces([]);
    setGameRunning(false);
    setGameOver(false);
    setScore(0);
    setLinesCleared(0);
  }

  function resetHighScore() {
    setBestScore(0);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('bestScore');
    }
  }

  // ---- Expose API ----
  return {
    board,
    currentPiece,
    ghostPiece,
    nextPieces,
    gameRunning,
    gameOver,
    score,
    linesCleared,
    bestScore,
    startGame,
    pauseGame,
    resetGame,
    resetHighScore,
    moveLeft,
    moveRight,
    moveDown,
    rotate,
    drop,
    // Optional: available if you want to read them
    dropInterval,
    elapsedTime,
  };
}

// =================== Pure helpers (outside hook scope) ===================

function createEmptyBoard(): Cell[][] {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({ filled: false, color: '' }))
  );
}
