// app/page.tsx

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-6">
      <h1 className="text-6xl font-extrabold tracking-widest text-red-500 drop-shadow-lg">
        TETRIS
      </h1>
      <p className="text-lg text-gray-300 max-w-md text-center">
        A retro Tetris game made with Next.js, TypeScript and Tailwind CSS v4.
      </p>
      <Link
        href="/tetris"
        className="bg-red-600 hover:bg-red-800 text-white px-6 py-3 rounded-2xl text-lg transition-all shadow-md"
      >
        Start Game
      </Link>
      <footer className="absolute bottom-6 text-sm text-gray-500">
        Built by Vennictus • 2025
      </footer>
    </main>
  );
}
