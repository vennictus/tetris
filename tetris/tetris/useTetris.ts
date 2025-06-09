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
  const [board, setBoard] = useState<Cell[][]>(createEmptyBoard());
  const [currentPiece, setCurrentPiece] = useState<CurrentPiece | null>(null);
  const [nextPieces, setNextPieces] = useState<CurrentPiece[]>([]);
  const [gameRunning, setGameRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [linesCleared, setLinesCleared] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [ghostPiece, setGhostPiece] = useState<CurrentPiece | null>(null);

  const nextPiecesRef = useRef<CurrentPiece[]>([]);
  const currentPieceRef = useRef<CurrentPiece | null>(null);

  useEffect(() => {
    nextPiecesRef.current = nextPieces;
  }, [nextPieces]);

  useEffect(() => {
    currentPieceRef.current = currentPiece;
  }, [currentPiece]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedBest = localStorage.getItem('bestScore');
      if (storedBest) setBestScore(Number(storedBest));
    }
  }, []);

  // Only start or reset when gameRunning becomes true
  useEffect(() => {
    if (gameRunning && !gameOver) {
      const initialQueue: CurrentPiece[] = [];
      for (let i = 0; i < 3; i++) {
        initialQueue.push(getRandomPiece());
      }
      const first = initialQueue.shift()!;
      setBoard(createEmptyBoard());
      setScore(0);
      setLinesCleared(0);
      setNextPieces(initialQueue);
      setCurrentPiece(first);
      setGameOver(false);
    }
  }, [gameRunning]);

  useEffect(() => {
    if (!currentPiece) {
      setGhostPiece(null);
      return;
    }
    const ghost = calculateGhostPiece(currentPiece, board);
    setGhostPiece(ghost);
  }, [currentPiece, board]);

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
            (board[boardRow] && board[boardRow][boardCol].filled)
          ) {
            return true;
          }
        }
      }
    }
    return false;
  }

  function mergePieceToBoard(piece: CurrentPiece, board: Cell[][]): Cell[][] {
    const newBoard = board.map(row => row.map(cell => ({ ...cell })));
    piece.shape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          const boardRow = piece.row + y;
          const boardCol = piece.col + x;
          if (boardRow >= 0 && boardRow < ROWS && boardCol >= 0 && boardCol < COLS) {
            newBoard[boardRow][boardCol] = { filled: true, color: piece.color };
          }
        }
      });
    });
    return newBoard;
  }

  function clearLines(board: Cell[][]): { newBoard: Cell[][]; linesCleared: number } {
    const newBoard: Cell[][] = [];
    let clearedLines = 0;

    for (let r = 0; r < ROWS; r++) {
      if (board[r].every(cell => cell.filled)) {
        clearedLines++;
      } else {
        newBoard.push(board[r]);
      }
    }

    for (let i = 0; i < clearedLines; i++) {
      newBoard.unshift(Array.from({ length: COLS }, () => ({ filled: false, color: '' })));
    }

    return { newBoard, linesCleared: clearedLines };
  }

  function rotatePiece(piece: CurrentPiece): CurrentPiece {
    const rotations = TETROMINOES[piece.tetrominoKey];
    const nextRotationIndex = (piece.rotationIndex + 1) % rotations.length;
    const nextShape = rotations[nextRotationIndex].shape;

    if (!checkCollision(nextShape, piece.row, piece.col)) {
      return { ...piece, shape: nextShape, rotationIndex: nextRotationIndex };
    }

    const kicks = [-1, 1, -2, 2];
    for (const kick of kicks) {
      if (!checkCollision(nextShape, piece.row, piece.col + kick)) {
        return {
          ...piece,
          shape: nextShape,
          col: piece.col + kick,
          rotationIndex: nextRotationIndex,
        };
      }
    }

    return piece;
  }

  function moveLeft() {
    if (!currentPiece || gameOver) return;
    const newCol = currentPiece.col - 1;
    if (!checkCollision(currentPiece.shape, currentPiece.row, newCol)) {
      setCurrentPiece({ ...currentPiece, col: newCol });
    }
  }

  function moveRight() {
    if (!currentPiece || gameOver) return;
    const newCol = currentPiece.col + 1;
    if (!checkCollision(currentPiece.shape, currentPiece.row, newCol)) {
      setCurrentPiece({ ...currentPiece, col: newCol });
    }
  }

  function moveDown(): boolean {
    if (!currentPiece || gameOver) return false;
    const newRow = currentPiece.row + 1;
    if (!checkCollision(currentPiece.shape, newRow, currentPiece.col)) {
      setCurrentPiece({ ...currentPiece, row: newRow });
      return true;
    } else {
      lockPiece();
      return false;
    }
  }

  function rotate() {
    if (!currentPiece || gameOver) return;
    const rotated = rotatePiece(currentPiece);
    setCurrentPiece(rotated);
  }

  function drop() {
    if (!currentPiece || gameOver) return;
    let dropRow = currentPiece.row;
    while (!checkCollision(currentPiece.shape, dropRow + 1, currentPiece.col)) {
      dropRow++;
    }
    lockPiece({ ...currentPiece, row: dropRow });
  }

  function lockPiece(pieceToLock?: CurrentPiece) {
    const piece = pieceToLock || currentPiece;
    if (!piece) return;

    const newBoard = mergePieceToBoard(piece, board);
    const { newBoard: clearedBoard, linesCleared: cleared } = clearLines(newBoard);

    setBoard(clearedBoard);
    setLinesCleared(prev => prev + cleared);

    if (cleared > 0) {
      setScore(prev => prev + calculateScore(cleared));
    } else {
      setScore(prev => prev + 5);
    }

    let queue = [...nextPiecesRef.current];
    while (queue.length < 3) {
      queue.push(getRandomPiece());
    }

    const next = queue.shift()!;
    setNextPieces(queue);
    setCurrentPiece(next);

    if (checkCollision(next.shape, next.row, next.col)) {
      setGameOver(true);
      setGameRunning(false);

      if (score > bestScore) {
        setBestScore(score);
        if (typeof window !== 'undefined') {
          localStorage.setItem('bestScore', String(score));
        }
      }
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

  function calculateGhostPiece(piece: CurrentPiece, board: Cell[][]): CurrentPiece {
    let ghostRow = piece.row;
    while (!checkCollision(piece.shape, ghostRow + 1, piece.col)) {
      ghostRow++;
    }
    return { ...piece, row: ghostRow };
  }

  function startGame() {
    setGameRunning(true);
    setGameOver(false);
  }

  function pauseGame() {
    setGameRunning(false);
  }

  function resetGame() {
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
  };
}
