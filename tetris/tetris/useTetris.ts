import { useState, useEffect, useRef } from 'react';

// You must have your TETROMINOES defined somewhere like this:
// Each key maps to an array of 4 rotation states with shape matrix and color
import { TETROMINOES } from './tetrominoes'; 

// Constants for the board size: 20 rows and 10 columns (standard Tetris)
const ROWS = 20;
const COLS = 10;

// Each cell on the board will have this structure:
// - filled: boolean whether a block occupies this cell
// - color: string that holds the color of the block filling the cell
export type Cell = {
  filled: boolean;
  color: string;
};

// Structure to keep track of the current moving piece
type CurrentPiece = {
  shape: number[][];       // 2D array representing the shape of the piece, e.g. [[0,1,0],[1,1,1]]
  color: string;           // Color string for the current piece
  row: number;             // Row position on the board (top-left of piece)
  col: number;             // Column position on the board (top-left of piece)
  rotationIndex: number;   // Which rotation state (0 to 3) the piece is currently in
  tetrominoKey: string;    // The key for the piece type in TETROMINOES (e.g. 'T', 'L', etc.)
};

// The main hook for managing the Tetris game state
export function useTetris() {
  // Board state: a 2D array representing the grid cells, each cell has filled + color
  const [board, setBoard] = useState<Cell[][]>(createEmptyBoard());

  // Current active piece that is falling
  const [currentPiece, setCurrentPiece] = useState<CurrentPiece | null>(null);

  // Is the game currently running or paused
  const [gameRunning, setGameRunning] = useState(false);

  // Have we reached the game over condition?
  const [gameOver, setGameOver] = useState(false);

  // Player's current score
  const [score, setScore] = useState(0);

  // Number of lines cleared so far in this game
  const [linesCleared, setLinesCleared] = useState(0);

  // Best score ever achieved (loaded from localStorage)
  const [bestScore, setBestScore] = useState(0);

  // A ref to keep track of any active timeout for lock delay (not used fully here, but ready)
  const lockDelayTimeout = useRef<NodeJS.Timeout | null>(null);

  /*
    useEffect runs only once on mount (component load).
    We load the bestScore from localStorage, but only on the client.
    This avoids errors when rendering on the server, because
    localStorage is only available in the browser.
  */
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedBest = localStorage.getItem("bestScore");
      if (storedBest) setBestScore(Number(storedBest));
    }
  }, []);

  /*
    When the component mounts, we want to create the first piece that
    will fall. This initializes the current piece state.
  */
  useEffect(() => {
    setCurrentPiece(getRandomPiece());
  }, []);

  /*
    Helper function to create an empty board grid.
    Returns a 2D array with ROWS rows and COLS columns,
    each cell starts empty (filled: false, color: '').
  */
  function createEmptyBoard(): Cell[][] {
    return Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => ({ filled: false, color: '' }))
    );
  }

  /*
    Helper function to pick a random piece from the TETROMINOES.
    It picks a random key (like 'T', 'L', 'O', etc.), sets rotation to 0,
    and centers the piece horizontally on the board.
  */
  function getRandomPiece(): CurrentPiece {
    const tetrominoKeys = Object.keys(TETROMINOES);

    // Pick a random piece key from available tetrominoes
    const tetrominoKey = tetrominoKeys[Math.floor(Math.random() * tetrominoKeys.length)];

    // Start rotation at index 0
    const rotationIndex = 0;

    // Get the shape & color for the initial rotation
    const tetromino = TETROMINOES[tetrominoKey][rotationIndex];

    // Center the piece horizontally on the board
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

  /*
    Checks if placing a shape at the specified row/col
    on the board would cause a collision (out of bounds or overlapping filled cells).
    Returns true if collision detected, false otherwise.
  */
  function checkCollision(shape: number[][], row: number, col: number): boolean {
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const boardRow = row + y;
          const boardCol = col + x;

          // Check out of bounds
          if (
            boardRow < 0 ||
            boardRow >= ROWS ||
            boardCol < 0 ||
            boardCol >= COLS ||
            (board[boardRow] && board[boardRow][boardCol]?.filled)
          ) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /*
    Clear any fully filled rows and return a new board
    along with the number of rows cleared.
  */
  function clearRows(board: Cell[][]): { clearedBoard: Cell[][]; clearedCount: number } {
    // Filter out rows that are completely filled (all cells filled)
    const newBoard = board.filter((row) => !row.every((cell) => cell.filled));

    // Number of rows cleared is difference between original rows and remaining rows
    const clearedCount = ROWS - newBoard.length;

    // Add empty rows on top to maintain board height
    while (newBoard.length < ROWS) {
      newBoard.unshift(Array.from({ length: COLS }, () => ({ filled: false, color: '' })));
    }

    return { clearedBoard: newBoard, clearedCount };
  }

  /*
    Clear any active lock delay timeout, if any.
    (In more advanced implementations, this prevents piece locking immediately
    after touching the ground and allows a small delay.)
  */
  function resetLockDelay() {
    if (lockDelayTimeout.current) {
      clearTimeout(lockDelayTimeout.current);
      lockDelayTimeout.current = null;
    }
  }

  /*
    Lock the current piece into the board when it can no longer move down.
    Update the board state, clear lines if any, update score and lines cleared,
    spawn a new piece or set game over if collision on spawn.
  */
  function lockPiece(piece: CurrentPiece) {
    const { shape, row, col, color } = piece;

    // Clone board so we can modify it safely
    const newBoard = board.map(r => r.slice());

    // For each block cell in the piece's shape, mark it filled on the board
    shape.forEach((r, y) => {
      r.forEach((cell, x) => {
        if (cell) {
          const boardRow = row + y;
          const boardCol = col + x;

          // Safety check for valid board positions
          if (boardRow >= 0 && boardRow < ROWS && boardCol >= 0 && boardCol < COLS) {
            newBoard[boardRow][boardCol] = { filled: true, color };
          }
        }
      });
    });

    // Clear any completed rows and get the cleared row count
    const { clearedBoard, clearedCount } = clearRows(newBoard);

    // Update the board state with cleared rows
    setBoard(clearedBoard);

    // Update score and lines cleared if any rows were cleared
    if (clearedCount > 0) {
      const points = clearedCount * 100;

      // Update score and check if we beat the best score
      setScore(prev => {
        const newScore = prev + points;
        if (newScore > bestScore) {
          setBestScore(newScore);

          // Save best score to localStorage for persistence
          if (typeof window !== "undefined") {
            localStorage.setItem("bestScore", newScore.toString());
          }
        }
        return newScore;
      });

      // Update lines cleared count
      setLinesCleared(prev => prev + clearedCount);
    }

    // Spawn a new piece for next turn
    const nextPiece = getRandomPiece();

    // If new piece collides immediately, game is over
    if (checkCollision(nextPiece.shape, nextPiece.row, nextPiece.col)) {
      setGameOver(true);
      setGameRunning(false);
    } else {
      // Otherwise set new piece as current piece
      setCurrentPiece(nextPiece);
    }
  }

  /*
    Move the current piece down by one row if possible.
    If not possible, lock the piece.
  */
  function moveDown() {
    if (!gameRunning || gameOver || !currentPiece) return;

    const { shape, row, col } = currentPiece;

    if (!checkCollision(shape, row + 1, col)) {
      resetLockDelay();
      setCurrentPiece({ ...currentPiece, row: row + 1 });
    } else {
      lockPiece(currentPiece);
    }
  }

  /*
    Move the current piece left by one column if possible.
  */
  function moveLeft() {
    if (!gameRunning || gameOver || !currentPiece) return;

    const { shape, row, col } = currentPiece;

    if (!checkCollision(shape, row, col - 1)) {
      resetLockDelay();
      setCurrentPiece({ ...currentPiece, col: col - 1 });
    }
  }

  /*
    Move the current piece right by one column if possible.
  */
  function moveRight() {
    if (!gameRunning || gameOver || !currentPiece) return;

    const { shape, row, col } = currentPiece;

    if (!checkCollision(shape, row, col + 1)) {
      resetLockDelay();
      setCurrentPiece({ ...currentPiece, col: col + 1 });
    }
  }

  /*
    Rotate the current piece clockwise if possible.
  */
  function rotate() {
    if (!gameRunning || gameOver || !currentPiece) return;

    const { tetrominoKey, rotationIndex, row, col } = currentPiece;

    // Calculate next rotation index (0-3)
    const nextIndex = (rotationIndex + 1) % 4;

    // Get the new rotated shape
    const nextShape = TETROMINOES[tetrominoKey][nextIndex].shape;

    // Only rotate if it won't cause a collision
    if (!checkCollision(nextShape, row, col)) {
      resetLockDelay();
      setCurrentPiece({
        ...currentPiece,
        shape: nextShape,
        rotationIndex: nextIndex,
      });
    }
  }

  /*
    Hard drop: instantly move the piece down until it collides,
    then lock it into the board.
  */
  function drop() {
    if (!gameRunning || gameOver || !currentPiece) return;

    const { shape, col } = currentPiece;
    let newRow = currentPiece.row;

    // Move down until collision
    while (!checkCollision(shape, newRow + 1, col)) {
      newRow++;
    }

    // Lock the piece at final position
    const finalPiece = { ...currentPiece, row: newRow };
    lockPiece(finalPiece);
  }

  /*
    Start a new game: reset board, score, lines, current piece, and flags.
  */
  function startGame() {
    setBoard(createEmptyBoard());
    setCurrentPiece(getRandomPiece());
    setScore(0);
    setLinesCleared(0);
    setGameOver(false);
    setGameRunning(true);
    resetLockDelay();
  }

  // resetGame is just an alias for startGame (convenience)
  const resetGame = startGame;

  // Return everything your React component will need to play/control the game
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
