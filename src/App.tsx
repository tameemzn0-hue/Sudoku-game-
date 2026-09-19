import React, { useState, useEffect } from 'react';
import './App.css';

// --- X-O AI Logic ---
type BoardState = (string | null)[];

const checkWinner = (board: BoardState) => {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  for (let [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return board.includes(null) ? null : 'Tie';
};

const getAIMove = (board: BoardState, difficulty: 'easy' | 'medium' | 'hard'): number => {
  const emptyIndices = board.map((val, idx) => (val === null ? idx : null)).filter((val) => val !== null) as number[];
  if (emptyIndices.length === 0) return -1;

  if (difficulty === 'easy') {
    return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  }

  // Medium / Hard logic
  for (let idx of emptyIndices) {
    const tempBoard = [...board];
    tempBoard[idx] = 'O';
    if (checkWinner(tempBoard) === 'O') return idx;
  }
  for (let idx of emptyIndices) {
    const tempBoard = [...board];
    tempBoard[idx] = 'X';
    if (checkWinner(tempBoard) === 'X') return idx;
  }

  if (difficulty === 'medium' && Math.random() > 0.5) {
    return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  }

  if (board[4] === null) return 4;
  return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'sudoku' | 'xo'>('sudoku');

  // --- Sudoku State ---
  const [grid, setGrid] = useState<number[][]>(Array(9).fill(0).map(() => Array(9).fill(0)));
  const [notes, setNotes] = useState<Set<number>[][]>(Array(9).fill(0).map(() => Array(9).fill(0).map(() => new Set())));
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [isNotesMode, setIsNotesMode] = useState<boolean>(false);
  const [history, setHistory] = useState<{ grid: number[][]; notes: Set<number>[][] }[]>([]);
  const [mistakes, setMistakes] = useState<number>(0);
  const [hintsLeft, setHintsLeft] = useState<number>(5);

  // Initialize Sudoku Dummy Board
  useEffect(() => {
    startNewSudoku();
  }, []);

  const startNewSudoku = () => {
    const initialGrid = [
      [5, 3, 0, 0, 7, 0, 0, 0, 0],
      [6, 0, 0, 1, 9, 5, 0, 0, 0],
      [0, 9, 8, 0, 0, 0, 0, 6, 0],
      [8, 0, 0, 0, 6, 0, 0, 0, 3],
      [4, 0, 0, 8, 0, 3, 0, 0, 1],
      [7, 0, 0, 0, 2, 0, 0, 0, 6],
      [0, 6, 0, 0, 0, 0, 2, 8, 0],
      [0, 0, 0, 4, 1, 9, 0, 0, 5],
      [0, 0, 0, 0, 8, 0, 0, 7, 9]
    ];
    setGrid(initialGrid);
    setNotes(Array(9).fill(0).map(() => Array(9).fill(0).map(() => new Set())));
    setHistory([]);
    setMistakes(0);
    setHintsLeft(5);
  };

  const saveHistory = () => {
    const gridCopy = grid.map(row => [...row]);
    const notesCopy = notes.map(row => row.map(cellSet => new Set(cellSet)));
    setHistory(prev => [...prev, { grid: gridCopy, notes: notesCopy }]);
  };

  const handleNumberInput = (num: number) => {
    if (!selectedCell) return;
    const [r, c] = selectedCell;
    saveHistory();

    if (isNotesMode) {
      const newNotes = notes.map(row => row.map(cellSet => new Set(cellSet)));
      if (newNotes[r][c].has(num)) {
        newNotes[r][c].delete(num);
      } else {
        newNotes[r][c].add(num);
      }
      setNotes(newNotes);
    } else {
      const newGrid = grid.map(row => [...row]);
      newGrid[r][c] = num;
      setGrid(newGrid);
    }
  };

  const handleErase = () => {
    if (!selectedCell) return;
    const [r, c] = selectedCell;
    saveHistory();
    const newGrid = grid.map(row => [...row]);
    newGrid[r][c] = 0;
    setGrid(newGrid);

    const newNotes = notes.map(row => row.map(cellSet => new Set(cellSet)));
    newNotes[r][c].clear();
    setNotes(newNotes);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previousState = history[history.length - 1];
    setGrid(previousState.grid);
    setNotes(previousState.notes);
    setHistory(prev => prev.slice(0, prev.length - 1));
  };

  const handleHint = () => {
    if (hintsLeft <= 0 || !selectedCell) return;
    setHintsLeft(prev => prev - 1);
  };

  // --- X-O State ---
  const [xoBoard, setXoBoard] = useState<BoardState>(Array(9).fill(null));
  const [isVsAI, setIsVsAI] = useState<boolean>(true);
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isXNext, setIsXNext] = useState<boolean>(true);

  const winner = checkWinner(xoBoard);

  const handleXOClick = (index: number) => {
    if (xoBoard[index] || winner) return;

    const newBoard = [...xoBoard];
    newBoard[index] = isXNext ? 'X' : 'O';
    setXoBoard(newBoard);

    if (isVsAI && !winner) {
      setIsXNext(false);
      setTimeout(() => {
        const aiMove = getAIMove(newBoard, aiDifficulty);
        if (aiMove !== -1) {
          newBoard[aiMove] = 'O';
          setXoBoard([...newBoard]);
        }
        setIsXNext(true);
      }, 300);
    } else {
      setIsXNext(!isXNext);
    }
  };

  const resetXO = () => {
    setXoBoard(Array(9).fill(null));
    setIsXNext(true);
  };

  return (
    <div style={{ background: '#0d1322', color: '#fff', minHeight: '100vh', padding: '15px', fontFamily: 'sans-serif' }}>
      {/* Navigation Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
        <button onClick={() => setActiveTab('sudoku')} style={{ background: activeTab === 'sudoku' ? '#2196F3' : '#1e293b', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '8px' }}>Sudoku</button>
        <button onClick={() => setActiveTab('xo')} style={{ background: activeTab === 'xo' ? '#2196F3' : '#1e293b', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '8px' }}>X - O Game</button>
      </div>

      {activeTab === 'sudoku' ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span>الأخطاء: {mistakes}/5</span>
            <button onClick={startNewSudoku} style={{ background: '#334155', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '5px' }}>لعبة جديدة 🔄</button>
          </div>

          {/* Sudoku Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: '2px', background: '#334155', padding: '4px', borderRadius: '8px' }}>
            {grid.map((row, rIdx) =>
              row.map((val, cIdx) => {
                const isSelected = selectedCell?.[0] === rIdx && selectedCell?.[1] === cIdx;
                const cellNotes = Array.from(notes[rIdx][cIdx]);
                return (
                  <div
                    key={`${rIdx}-${cIdx}`}
                    onClick={() => setSelectedCell([rIdx, cIdx])}
                    style={{
                      aspectRatio: '1',
                      background: isSelected ? '#1e3a8a' : '#1e293b',
                      color: val ? '#60a5fa' : '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                  >
                    {val !== 0 ? val : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', fontSize: '8px', width: '100%', height: '100%', padding: '1px' }}>
                        {[1,2,3,4,5,6,7,8,9].map(n => (
                          <span key={n} style={{ textAlign: 'center' }}>{cellNotes.includes(n) ? n : ''}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Keypad */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '5px', marginTop: '15px' }}>
            {[1,2,3,4,5,6,7,8,9].map(n => (
              <button key={n} onClick={() => handleNumberInput(n)} style={{ background: '#1e293b', color: '#38bdf8', border: 'none', padding: '12px', fontSize: '18px', borderRadius: '6px' }}>{n}</button>
            ))}
            <button onClick={handleErase} style={{ background: '#1e293b', color: '#f43f5e', border: 'none', padding: '12px', borderRadius: '6px' }}>مسح ⌫</button>
          </div>

          {/* Controls: Undo, Notes, Hint */}
          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '15px' }}>
            <button onClick={handleUndo} style={{ background: '#334155', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '6px' }}>تراجع ↩</button>
            <button onClick={() => setIsNotesMode(!isNotesMode)} style={{ background: isNotesMode ? '#10b981' : '#334155', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '6px' }}>
              الملاحظات ✏️ ({isNotesMode ? 'مُفعل' : 'مُعطل'})
            </button>
            <button onClick={handleHint} style={{ background: '#334155', color: '#f59e0b', border: 'none', padding: '10px 15px', borderRadius: '6px' }}>تلميح 💡 ({hintsLeft})</button>
          </div>
        </div>
      ) : (
        <div>
          {/* X-O Mode Selector */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <button onClick={() => setIsVsAI(true)} style={{ flex: 1, background: isVsAI ? '#0284c7' : '#1e293b', color: '#fff', padding: '10px', border: 'none', borderRadius: '6px' }}>ضد الذكاء الاصطناعي 🤖</button>
            <button onClick={() => setIsVsAI(false)} style={{ flex: 1, background: !isVsAI ? '#0284c7' : '#1e293b', color: '#fff', padding: '10px', border: 'none', borderRadius: '6px' }}>لاعبين 👥</button>
          </div>

          {/* AI Difficulty Selector */}
          {isVsAI && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '15px' }}>
              {(['easy', 'medium', 'hard'] as const).map(level => (
                <button
                  key={level}
                  onClick={() => { setAiDifficulty(level); resetXO(); }}
                  style={{
                    background: aiDifficulty === level ? '#eab308' : '#334155',
                    color: '#fff',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    textTransform: 'capitalize'
                  }}
                >
                  {level === 'easy' ? 'سهل' : level === 'medium' ? 'متوسط' : 'صعب'}
                </button>
              ))}
            </div>
          )}

          <div style={{ textAlign: 'center', marginBottom: '10px', fontSize: '18px' }}>
            {winner ? (winner === 'Tie' ? 'تعادل!' : `الفائز: ${winner}`) : `دور اللاعب: ${isXNext ? 'X' : 'O'}`}
          </div>

          {/* X-O Board */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '5px', background: '#334155', padding: '5px', borderRadius: '8px' }}>
            {xoBoard.map((cell, idx) => (
              <button
                key={idx}
                onClick={() => handleXOClick(idx)}
                style={{
                  aspectRatio: '1',
                  background: '#1e293b',
                  color: cell === 'X' ? '#38bdf8' : '#f43f5e',
                  fontSize: '36px',
                  fontWeight: 'bold',
                  border: 'none',
                  borderRadius: '6px'
                }}
              >
                {cell}
              </button>
            ))}
          </div>

          <button onClick={resetXO} style={{ width: '100%', marginTop: '15px', background: '#334155', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px' }}>إعادة اللعب 🔄</button>
        </div>
      )}
    </div>
  );
}
