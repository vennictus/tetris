// Define the structure of a Tetromino piece
export type Tetromino = {
  shape: number[][];   // A 2D matrix where 1 = block, 0 = empty
  color: string;       // Tailwind background color class
};

// Dictionary of all 7 Tetrominoes, each with 4 rotation states
export const TETROMINOES: Record<string, Tetromino[]> = {
  I: [
    { shape: [[1, 1, 1, 1]], color: 'bg-cyan-500' },
    { shape: [[1], [1], [1], [1]], color: 'bg-cyan-500' },
    { shape: [[1, 1, 1, 1]], color: 'bg-cyan-500' },
    { shape: [[1], [1], [1], [1]], color: 'bg-cyan-500' },
  ],
  O: [
    { shape: [[1, 1], [1, 1]], color: 'bg-yellow-400' },
    { shape: [[1, 1], [1, 1]], color: 'bg-yellow-400' },
    { shape: [[1, 1], [1, 1]], color: 'bg-yellow-400' },
    { shape: [[1, 1], [1, 1]], color: 'bg-yellow-400' },
  ],
  T: [
    { shape: [[0, 1, 0], [1, 1, 1]], color: 'bg-purple-500' },
    { shape: [[1, 0], [1, 1], [1, 0]], color: 'bg-purple-500' },
    { shape: [[1, 1, 1], [0, 1, 0]], color: 'bg-purple-500' },
    { shape: [[0, 1], [1, 1], [0, 1]], color: 'bg-purple-500' },
  ],
  S: [
    { shape: [[0, 1, 1], [1, 1, 0]], color: 'bg-green-500' },
    { shape: [[1, 0], [1, 1], [0, 1]], color: 'bg-green-500' },
    { shape: [[0, 1, 1], [1, 1, 0]], color: 'bg-green-500' },
    { shape: [[1, 0], [1, 1], [0, 1]], color: 'bg-green-500' },
  ],
  Z: [
    { shape: [[1, 1, 0], [0, 1, 1]], color: 'bg-red-500' },
    { shape: [[0, 1], [1, 1], [1, 0]], color: 'bg-red-500' },
    { shape: [[1, 1, 0], [0, 1, 1]], color: 'bg-red-500' },
    { shape: [[0, 1], [1, 1], [1, 0]], color: 'bg-red-500' },
  ],
  J: [
    { shape: [[1, 0, 0], [1, 1, 1]], color: 'bg-blue-500' },
    { shape: [[1, 1], [1, 0], [1, 0]], color: 'bg-blue-500' },
    { shape: [[1, 1, 1], [0, 0, 1]], color: 'bg-blue-500' },
    { shape: [[0, 1], [0, 1], [1, 1]], color: 'bg-blue-500' },
  ],
  L: [
    { shape: [[0, 0, 1], [1, 1, 1]], color: 'bg-orange-500' },
    { shape: [[1, 0], [1, 0], [1, 1]], color: 'bg-orange-500' },
    { shape: [[1, 1, 1], [1, 0, 0]], color: 'bg-orange-500' },
    { shape: [[1, 1], [0, 1], [0, 1]], color: 'bg-orange-500' },
  ],
};
