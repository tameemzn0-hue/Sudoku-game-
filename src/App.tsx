import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Grid,
  Difficulty,
  generatePuzzle,
  cloneGrid,
  isSolved,
  findConflicts,
} from '@/lib/sudoku';
import {
  Undo2,
  Eraser,
  Lightbulb,
  RefreshCw,
  Timer,
  Trophy,
  Pencil,
  XCircle,
} from 'lucide-react';

type Notes = Set<number>[][];

type GameState = {
  puzzle: Grid;
  solution: Grid;
  board: Grid;
  notes: Notes;
  given: boolean[][];
};

type HistoryEntry = {
  row: number;
  col: number;
  prevValue: number | null;
  prevNotes: Set<number>;
};

const DIFFICULTIES: { key: Difficulty; label: string; color: string }[] = [
  { key: 'easy', label: 'Easy', color: 'emerald' },
  { key: 'medium', label: 'Medium', color: 'amber' },
  { key: 'hard', label: 'Hard', color: 'orange' },
  { key: 'expert', label: 'Expert', color: 'rose' },
];

function emptyNotes(): Notes {
  return Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => new Set<number>())
  );
}

function cloneNotes(notes: Notes): Notes {
  return notes.map((row) => row.map((set) => new Set(set)));
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function App() {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [noteMode, setNoteMode] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [won, setWon] = useState(false);
  const [hintCount, setHintCount] = useState(0);
  const timerRef = useRef<number | null>(null);

  const newGame = useCallback((diff: Difficulty) => {
    const { puzzle, solution } = generatePuzzle(diff);
    const given = puzzle.map((row) => row.map((v) => v !== null));
    setGameState({
      puzzle: cloneGrid(puzzle),
      solution: cloneGrid(solution),
      board: cloneGrid(puzzle),
      notes: emptyNotes(),
      given,
    });
    setSelected(null);
    setHistory([]);
    setNoteMode(false);
    setMistakes(0);
    setElapsed(0);
    setRunning(true);
    setWon(false);
    setHintCount(0);
  }, []);

  useEffect(() => {
    newGame('medium');
  }, [newGame]);

  useEffect(() => {
    if (running && !won) {
      timerRef.current = window.setInterval(() => {
        setElapsed((e) => e + 1);
      }, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [running, won]);

  const conflicts = useMemo(() => {
    if (!gameState) return new Set<string>();
    const set = new Set<string>();
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const v = gameState.board[r][c];
        if (v === null) continue;
        const found = findConflicts(gameState.board, r, c, v);
        if (found.length > 0) {
          set.add(`${r},${c}`);
          found.forEach(([fr, fc]) => set.add(`${fr},${fc}`));
        }
      }
    }
    return set;
  }, [gameState]);

  const handleInput = useCallback(
    (num: number) => {
      if (!gameState || !selected || won) return;
      const [row, col] = selected;
      if (gameState.given[row][col]) return;

      if (noteMode) {
        if (gameState.board[row][col] !== null) return;
        setHistory((prev) => [
          ...prev,
          {
            row,
            col,
            prevValue: gameState.board[row][col],
            prevNotes: new Set(gameState.notes[row][col]),
          },
        ]);
        setGameState((prev) => {
          if (!prev) return prev;
          const notes = cloneNotes(prev.notes);
          if (notes[row][col].has(num)) {
            notes[row][col].delete(num);
          } else {
            notes[row][col].add(num);
          }
          return { ...prev, notes };
        });
        return;
      }

      setHistory((prev) => [
        ...prev,
        {
          row,
          col,
          prevValue: gameState.board[row][col],
          prevNotes: new Set(gameState.notes[row][col]),
        },
      ]);

      setGameState((prev) => {
        if (!prev) return prev;
        const board = cloneGrid(prev.board);
        const notes = cloneNotes(prev.notes);
        board[row][col] = num;
        notes[row][col].clear();

        if (prev.solution[row][col] !== num) {
          setMistakes((m) => m + 1);
        }

        if (isSolved(board, prev.solution)) {
          setRunning(false);
          setWon(true);
        }

        return { ...prev, board, notes };
      });
    },
    [gameState, selected, noteMode, won]
  );

  const handleErase = useCallback(() => {
    if (!gameState || !selected || won) return;
    const [row, col] = selected;
    if (gameState.given[row][col]) return;

    setHistory((prev) => [
      ...prev,
      {
        row,
        col,
        prevValue: gameState.board[row][col],
        prevNotes: new Set(gameState.notes[row][col]),
      },
    ]);

    setGameState((prev) => {
      if (!prev) return prev;
      const board = cloneGrid(prev.board);
      const notes = cloneNotes(prev.notes);
      board[row][col] = null;
      notes[row][col].clear();
      return { ...prev, board, notes };
    });
  }, [gameState, selected, won]);

  const handleUndo = useCallback(() => {
    if (history.length === 0 || !gameState) return;
    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setGameState((prev) => {
      if (!prev) return prev;
      const board = cloneGrid(prev.board);
      const notes = cloneNotes(prev.notes);
      board[last.row][last.col] = last.prevValue;
      notes[last.row][last.col] = last.prevNotes;
      return { ...prev, board, notes };
    });
  }, [history, gameState]);

  const handleHint = useCallback(() => {
    if (!gameState || !selected || won) return;
    const [row, col] = selected;
    if (gameState.given[row][col]) return;

    setHistory((prev) => [
      ...prev,
      {
        row,
        col,
        prevValue: gameState.board[row][col],
        prevNotes: new Set(gameState.notes[row][col]),
      },
    ]);

    setHintCount((h) => h + 1);

    setGameState((prev) => {
      if (!prev) return prev;
      const board = cloneGrid(prev.board);
      const notes = cloneNotes(prev.notes);
      board[row][col] = prev.solution[row][col];
      notes[row][col].clear();

      if (isSolved(board, prev.solution)) {
        setRunning(false);
        setWon(true);
      }

      return { ...prev, board, notes };
    });
  }, [gameState, selected, won]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (won) return;
      if (e.key >= '1' && e.key <= '9') {
        handleInput(parseInt(e.key));
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        handleErase();
      } else if (e.key === 'n' || e.key === 'N') {
        setNoteMode((n) => !n);
      } else if (e.key === 'z' || e.key === 'Z') {
        handleUndo();
      } else if (selected) {
        const [r, c] = selected;
        let nr = r,
          nc = c;
        if (e.key === 'ArrowUp') nr = Math.max(0, r - 1);
        else if (e.key === 'ArrowDown') nr = Math.min(8, r + 1);
        else if (e.key === 'ArrowLeft') nc = Math.max(0, c - 1);
        else if (e.key === 'ArrowRight') nc = Math.min(8, c + 1);
        else return;
        e.preventDefault();
        setSelected([nr, nc]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleInput, handleErase, handleUndo, selected, won]);

  const selectedValue = useMemo(() => {
    if (!selected || !gameState) return null;
    return gameState.board[selected[0]][selected[1]];
  }, [selected, gameState]);

  const numberCounts = useMemo(() => {
    if (!gameState) return {} as Record<number, number>;
    const counts: Record<number, number> = {};
    for (let i = 1; i <= 9; i++) counts[i] = 0;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const v = gameState.board[r][c];
        if (v !== null) counts[v]++;
      }
    }
    return counts;
  }, [gameState]);

  if (!gameState) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 flex flex-col items-center py-6 px-4">
      {/* Header */}
      <header className="w-full max-w-2xl flex items-center justify-between mb-6 animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Grid3x3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">
              Sudoku
            </h1>
            <p className="text-xs text-slate-400">Logic puzzle game</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-800/60 backdrop-blur rounded-lg px-3 py-1.5 border border-slate-700/50">
            <Timer className="w-4 h-4 text-sky-400" />
            <span className="font-mono text-sm tabular-nums">
              {formatTime(elapsed)}
            </span>
          </div>
        </div>
      </header>

      {/* Stats bar */}
      <div className="w-full max-w-md flex items-center justify-center gap-8 mb-4 text-sm animate-fade-up">
        <div className="flex items-center gap-2">
          <XCircle className="w-4 h-4 text-rose-400" />
          <span className="text-slate-400">Mistakes:</span>
          <span className="font-semibold text-rose-400">{mistakes}</span>
        </div>
        <div className="w-px h-4 bg-slate-700" />
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <span className="text-slate-400">Hints:</span>
          <span className="font-semibold text-amber-400">{hintCount}</span>
        </div>
      </div>

      {/* Difficulty selector */}
      <div className="w-full max-w-md flex gap-2 mb-5 animate-fade-up">
        {DIFFICULTIES.map((d) => (
          <button
            key={d.key}
            onClick={() => newGame(d.key)}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
              difficulty === d.key
                ? `bg-${d.color}-500 text-white shadow-lg shadow-${d.color}-500/30 scale-105`
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700/60 hover:text-slate-200 border border-slate-700/50'
            }`}
            style={
              difficulty === d.key
                ? {
                    backgroundColor: difficultyColor(d.key),
                    boxShadow: `0 4px 15px ${difficultyColor(d.key)}40`,
                  }
                : undefined
            }
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Sudoku Board */}
      <div
        className={`relative bg-slate-800/40 backdrop-blur rounded-2xl p-3 border border-slate-700/50 shadow-2xl shadow-slate-950/50 ${
          won ? 'animate-celebrate' : ''
        }`}
      >
        <div className="grid grid-cols-9 gap-0">
          {gameState.board.map((row, r) =>
            row.map((cell, c) => {
              const isGiven = gameState.given[r][c];
              const isSelected = selected && selected[0] === r && selected[1] === c;
              const sameValue =
                selectedValue !== null &&
                cell === selectedValue &&
                !isSelected;
              const inSameRow = selected && selected[0] === r;
              const inSameCol = selected && selected[1] === c;
              const inSameBox =
                selected &&
                Math.floor(selected[0] / 3) === Math.floor(r / 3) &&
                Math.floor(selected[1] / 3) === Math.floor(c / 3);
              const isHighlighted =
                !isSelected && (inSameRow || inSameCol || inSameBox);
              const isConflict = conflicts.has(`${r},${c}`);
              const isCorrect =
                !isGiven && cell !== null && cell === gameState.solution[r][c];

              const borderRight =
                (c + 1) % 3 === 0 && c !== 8 ? 'border-r-2 border-r-slate-500/60' : '';
              const borderBottom =
                (r + 1) % 3 === 0 && r !== 8 ? 'border-b-2 border-b-slate-500/60' : '';

              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => setSelected([r, c])}
                  className={`sudoku-cell w-9 h-9 sm:w-12 sm:h-12 flex items-center justify-center text-lg sm:text-xl font-semibold relative ${borderRight} ${borderBottom} ${
                    isSelected
                      ? 'bg-sky-500/30 ring-2 ring-sky-400 z-10'
                      : isHighlighted
                      ? 'bg-slate-700/50'
                      : 'bg-slate-800/20'
                  } ${isConflict ? 'bg-rose-500/30 text-rose-300' : ''} ${
                    sameValue ? 'bg-sky-500/20' : ''
                  }`}
                >
                  {cell !== null ? (
                    <span
                      className={`animate-pop-in ${
                        isGiven
                          ? 'text-slate-100'
                          : isConflict
                          ? 'text-rose-300'
                          : isCorrect
                          ? 'text-sky-400'
                          : 'text-slate-300'
                      }`}
                    >
                      {cell}
                    </span>
                  ) : (
                    gameState.notes[r][c].size > 0 && (
                      <div className="grid grid-cols-3 gap-0 w-full h-full p-0.5">
                        {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
                          <div
                            key={n}
                            className="flex items-center justify-center text-[7px] sm:text-[9px] text-slate-500 leading-none"
                          >
                            {gameState.notes[r][c].has(n) ? n : ''}
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Win overlay */}
        {won && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center animate-fade-up z-20">
            <Trophy className="w-16 h-16 text-amber-400 mb-3 animate-glow" />
            <h2 className="text-2xl font-bold text-white mb-1">Puzzle Solved!</h2>
            <p className="text-slate-300 text-sm mb-4">
              {formatTime(elapsed)} • {mistakes} mistakes • {hintCount} hints
            </p>
            <button
              onClick={() => newGame(difficulty)}
              className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-cyan-500 text-white rounded-xl font-semibold shadow-lg shadow-sky-500/30 hover:scale-105 transition-transform"
            >
              Play Again
            </button>
          </div>
        )}
      </div>

      {/* Number pad */}
      <div className="w-full max-w-md mt-5 grid grid-cols-9 gap-1.5 sm:gap-2 animate-fade-up">
        {Array.from({ length: 9 }, (_, i) => i + 1).map((num) => {
          const complete = numberCounts[num] === 9;
          return (
            <button
              key={num}
              onClick={() => handleInput(num)}
              disabled={complete}
              className={`aspect-square rounded-lg text-lg sm:text-xl font-bold transition-all duration-200 ${
                complete
                  ? 'bg-slate-800/30 text-slate-600 cursor-not-allowed'
                  : 'bg-slate-800/60 text-sky-300 hover:bg-sky-500/20 hover:scale-110 active:scale-95 border border-slate-700/50'
              }`}
            >
              {num}
            </button>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="w-full max-w-md mt-4 grid grid-cols-5 gap-2 animate-fade-up">
        <ActionButton
          icon={<Undo2 className="w-5 h-5" />}
          label="Undo"
          onClick={handleUndo}
          disabled={history.length === 0}
        />
        <ActionButton
          icon={<Eraser className="w-5 h-5" />}
          label="Erase"
          onClick={handleErase}
          disabled={!selected || (selected && gameState.given[selected[0]][selected[1]])}
        />
        <ActionButton
          icon={<Pencil className="w-5 h-5" />}
          label="Notes"
          onClick={() => setNoteMode((n) => !n)}
          active={noteMode}
        />
        <ActionButton
          icon={<Lightbulb className="w-5 h-5" />}
          label="Hint"
          onClick={handleHint}
          disabled={!selected || (selected && gameState.given[selected[0]][selected[1]])}
        />
        <ActionButton
          icon={<RefreshCw className="w-5 h-5" />}
          label="New"
          onClick={() => newGame(difficulty)}
        />
      </div>

      {/* Mobile note indicator */}
      {noteMode && (
        <div className="mt-3 flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
          <Pencil className="w-3 h-3" />
          Note mode active — tap numbers to add/remove pencil marks
        </div>
      )}

      {/* Keyboard hints */}
      <div className="mt-4 text-center text-xs text-slate-500 animate-fade-up">
        <p>Use arrow keys to navigate • 1-9 to place • N for notes • Z to undo</p>
      </div>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  disabled,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
        disabled
          ? 'bg-slate-800/20 text-slate-600 cursor-not-allowed'
          : active
          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 scale-105'
          : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/60 border border-slate-700/50 hover:scale-105 active:scale-95'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function difficultyColor(diff: Difficulty): string {
  switch (diff) {
    case 'easy':
      return '#10b981';
    case 'medium':
      return '#f59e0b';
    case 'hard':
      return '#f97316';
    case 'expert':
      return '#f43f5e';
  }
}

function Grid3x3({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
    </svg>
  );
}
