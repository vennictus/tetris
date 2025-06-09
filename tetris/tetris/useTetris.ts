import { useState, useEffect, useRef } from 'react';
import { TETROMINOES } from './tetrominoes'; // Your tetromino shapes and colors

// Constants for the Tetris board size
const ROWS = 20; // standard Tetris height
const COLS = 10; // standard Tetris width

// Type representing a single cell on the board
export type Cell = {
  filled: boolean;  // whether the cell is occupied by a piece
  color: string;    // color of the cell if filled
};

// Type representing the current falling piece (tetromino)
type CurrentPiece = {
  shape: number[][];      // 2D matrix representing the shape (1 = block, 0 = empty)
  color: string;          // color of the piece
  row: number;            // current top-left row position on board
  col: number;            // current top-left column position on board
  rotationIndex: number;  // index of current rotation state
  tetrominoKey: string;   // identifier key from TETROMINOES
};

export function useTetris() {
  // Game state hooks
  const [board, setBoard] = useState<Cell[][]>(createEmptyBoard()); // The game board matrix
  const [currentPiece, setCurrentPiece] = useState<CurrentPiece | null>(null); // Active falling piece
  const [nextPieces, setNextPieces] = useState<CurrentPiece[]>([]); // Queue of next pieces
  const [gameRunning, setGameRunning] = useState(false); // Is the game running
  const [gameOver, setGameOver] = useState(false); // Is game over
  const [score, setScore] = useState(0); // Current score
  const [linesCleared, setLinesCleared] = useState(0); // Total cleared lines
  const [bestScore, setBestScore] = useState(0); // Highest score saved locally

  // Ghost piece to show where the current piece will land if dropped
  const [ghostPiece, setGhostPiece] = useState<CurrentPiece | null>(null);

  // Refs to keep track of currentPiece and nextPieces outside state updates (for async consistency)
  const nextPiecesRef = useRef<CurrentPiece[]>([]);
  const currentPieceRef = useRef<CurrentPiece | null>(null);

  // Sync refs with state changes
  useEffect(() => {
    nextPiecesRef.current = nextPieces;
  }, [nextPieces]);

  useEffect(() => {
    currentPieceRef.current = currentPiece;
  }, [currentPiece]);

  // Load bestScore from localStorage on mount (only runs on client)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedBest = localStorage.getItem('bestScore');
      if (storedBest) setBestScore(Number(storedBest));
    }
  }, []);

  // When the gameRunning state changes, initialize or reset game accordingly
  useEffect(() => {
    if (gameRunning) {
      // Prepare initial queue of 3 random pieces
      const initialQueue: CurrentPiece[] = [];
      for (let i = 0; i < 3; i++) {
        initialQueue.push(getRandomPiece());
      }
      setNextPieces(initialQueue);

      // Set the first piece as current and update the queue
      const first = initialQueue.shift()!;
      setCurrentPiece(first);
      setNextPieces(initialQueue);

      // Reset the board and score-related states
      setBoard(createEmptyBoard());
      setScore(0);
      setLinesCleared(0);
      setGameOver(false);
    } else {
      resetGame();
    }
  }, [gameRunning]);

  // Update ghost piece whenever currentPiece or board changes
  useEffect(() => {
    if (!currentPiece) {
      setGhostPiece(null);
      return;
    }
    const ghost = calculateGhostPiece(currentPiece, board);
    setGhostPiece(ghost);
  }, [currentPiece, board]);

  // Create an empty board with all cells unfilled and no color
  function createEmptyBoard(): Cell[][] {
    return Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => ({ filled: false, color: '' }))
    );
  }

  // Generate a random new tetromino piece from TETROMINOES
  function getRandomPiece(): CurrentPiece {
    const tetrominoKeys = Object.keys(TETROMINOES);
    const tetrominoKey = tetrominoKeys[Math.floor(Math.random() * tetrominoKeys.length)];
    const rotationIndex = 0;
    const tetromino = TETROMINOES[tetrominoKey][rotationIndex];
    // Center the piece horizontally at spawn
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

  // Check if a piece at a specific position would collide with the board or filled cells
  function checkCollision(shape: number[][], row: number, col: number): boolean {
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const boardRow = row + y;
          const boardCol = col + x;
          // Out of bounds or cell already filled means collision
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

  // Merge a piece's blocks into the board (for locking)
  function mergePieceToBoard(piece: CurrentPiece, board: Cell[][]): Cell[][] {
    // Deep copy the board to avoid mutation
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

  // Clear completed lines and return updated board and number of lines cleared
  function clearLines(board: Cell[][]): { newBoard: Cell[][]; linesCleared: number } {
    const newBoard: Cell[][] = [];
    let clearedLines = 0;

    for (let r = 0; r < ROWS; r++) {
      // If all cells in a row are filled, it's a completed line
      if (board[r].every(cell => cell.filled)) {
        clearedLines++;
      } else {
        newBoard.push(board[r]);
      }
    }

    // Add empty rows at the top for the cleared lines
    for (let i = 0; i < clearedLines; i++) {
      newBoard.unshift(
        Array.from({ length: COLS }, () => ({ filled: false, color: '' }))
      );
    }

    return { newBoard, linesCleared: clearedLines };
  }

  // Rotate the piece clockwise and try to apply wall kicks to prevent collisions
  function rotatePiece(piece: CurrentPiece): CurrentPiece {
    const rotations = TETROMINOES[piece.tetrominoKey];
    const nextRotationIndex = (piece.rotationIndex + 1) % rotations.length;
    const nextShape = rotations[nextRotationIndex].shape;

    // Try rotation without horizontal offset first
    if (!checkCollision(nextShape, piece.row, piece.col)) {
      return {
        ...piece,
        shape: nextShape,
        rotationIndex: nextRotationIndex,
      };
    }

    // Try wall kicks: small horizontal shifts to allow rotation near walls
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

    // If no valid rotation found, return original piece
    return piece;
  }

  // Move the current piece one column left if possible
  function moveLeft() {
    if (!currentPiece || gameOver) return;
    const newCol = currentPiece.col - 1;
    if (!checkCollision(currentPiece.shape, currentPiece.row, newCol)) {
      setCurrentPiece({ ...currentPiece, col: newCol });
    }
  }

  // Move the current piece one column right if possible
  function moveRight() {
    if (!currentPiece || gameOver) return;
    const newCol = currentPiece.col + 1;
    if (!checkCollision(currentPiece.shape, currentPiece.row, newCol)) {
      setCurrentPiece({ ...currentPiece, col: newCol });
    }
  }

  // Move the current piece down by one row if possible; lock piece if it cannot move down
  // Returns true if moved down, false if locked
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

  // Rotate the current piece clockwise with wall kicks
  function rotate() {
    if (!currentPiece || gameOver) return;
    const rotated = rotatePiece(currentPiece);
    setCurrentPiece(rotated);
  }

  // Instantly drop the piece to the lowest possible position and lock it
  function drop() {
    if (!currentPiece || gameOver) return;

    let dropRow = currentPiece.row;
    // Keep moving down until collision would occur
    while (!checkCollision(currentPiece.shape, dropRow + 1, currentPiece.col)) {
      dropRow++;
    }

    // Lock piece at final position
    lockPiece({ ...currentPiece, row: dropRow });
  }

  // Lock a piece on the board, clear lines, update score and spawn next piece
  // Optionally accepts a piece to lock, defaults to currentPiece
  function lockPiece(pieceToLock?: CurrentPiece) {
    const piece = pieceToLock || currentPiece;
    if (!piece) return;

    // Merge the piece into the board
    const newBoard = mergePieceToBoard(piece, board);
    // Clear any complete lines
    const { newBoard: clearedBoard, linesCleared: cleared } = clearLines(newBoard);

    setBoard(clearedBoard);
    setLinesCleared(prev => prev + cleared);

    // Scoring: points for lines cleared, small points for locking without clearing
    if (cleared > 0) {
      setScore(prev => prev + calculateScore(cleared));
    } else {
      setScore(prev => prev + 5); // small points for locking with no line clear
    }

    // Keep the nextPieces queue length 3
    let queue = [...nextPiecesRef.current];
    while (queue.length < 3) {
      queue.push(getRandomPiece());
    }
    // Take the next piece from the queue
    const next = queue.shift()!;
    setNextPieces(queue);
    setCurrentPiece(next);

    // If next piece collides at spawn, game over
    if (checkCollision(next.shape, next.row, next.col)) {
      setGameOver(true);
      setGameRunning(false);

      // Save best score if beaten
      if (score > bestScore) {
        setBestScore(score);
        if (typeof window !== 'undefined') {
          localStorage.setItem('bestScore', String(score));
        }
      }
    }
  }

  // Standard Tetris scoring based on lines cleared at once
  function calculateScore(lines: number): number {
    switch (lines) {
      case 1:
        return 100;
      case 2:
        return 300;
      case 3:
        return 500;
      case 4:
        return 800;
      default:
        return 0;
    }
  }

  // Calculate the ghost piece position (where the piece would land if dropped)
  function calculateGhostPiece(piece: CurrentPiece, board: Cell[][]): CurrentPiece {
    let ghostRow = piece.row;
    while (!checkCollision(piece.shape, ghostRow + 1, piece.col)) {
      ghostRow++;
    }
    return { ...piece, row: ghostRow };
  }

  // Start the game (sets gameRunning to true, triggers initialization)
  function startGame() {
    setGameRunning(true);
  }

  // Pause the game (stops the game loop)
  function pauseGame() {
    setGameRunning(false);
  }

  // Reset the game state completely
  function resetGame() {
    setBoard(createEmptyBoard());
    setCurrentPiece(null);
    setNextPieces([]);
    setGameRunning(false);
    setGameOver(false);
    setScore(0);
    setLinesCleared(0);
  }
    // Add this function inside useTetris
function resetHighScore() {
  setBestScore(0);
  if (typeof window !== 'undefined') {
    localStorage.removeItem('bestScore');
  }
}

  // Expose all necessary game state and controls
  return {
    board,
    currentPiece,
    nextPieces,
    ghostPiece,
    gameRunning,
    gameOver,
    score,
    linesCleared,
    bestScore,
    startGame,
    pauseGame,
    resetGame,
    moveLeft,
    moveRight,
    moveDown,
    rotate,
    drop,
    resetHighScore,
  };
}
