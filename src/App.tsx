import React, { useState, useEffect } from 'react';

type BoardState = (string | null)[];
type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Expert';

const SUDOKU_BOARDS: Record<Difficulty, number[][][]> = {
  Easy: [
    [
      [5, 3, 0, 0, 7, 0, 0, 0, 0],
      [6, 0, 0, 1, 9, 5, 0, 0, 0],
      [0, 9, 8, 0, 0, 0, 0, 6, 0],
      [8, 0, 0, 0, 6, 0, 0, 0, 3],
      [4, 0, 0, 8, 0, 3, 0, 0, 1],
      [7, 0, 0, 0, 2, 0, 0, 0, 6],
      [0, 6, 0, 0, 0, 0, 2, 8, 0],
      [0, 0, 0, 4, 1, 9, 0, 0, 5],
      [0, 0, 0, 0, 8, 0, 0, 7, 9]
    ],
    [
      [1, 0, 4, 0, 0, 0, 7, 0, 9],
      [0, 3, 2, 5, 0, 0, 0, 8, 0],
      [0, 0, 0, 0, 1, 0, 5, 0, 0],
      [0, 0, 0, 2, 0, 8, 0, 0, 4],
      [0, 5, 0, 0, 0, 0, 0, 3, 0],
      [2, 0, 0, 9, 0, 5, 0, 0, 0],
      [0, 0, 9, 0, 3, 0, 0, 0, 0],
      [0, 2, 0, 0, 0, 7, 1, 4, 0],
      [3, 0, 5, 0, 0, 0, 8, 0, 6]
    ]
  ],
  Medium: [
    [
      [0, 0, 0, 2, 6, 0, 7, 0, 1],
      [6, 8, 0, 0, 7, 0, 0, 9, 0],
      [1, 9, 0, 0, 0, 4, 5, 0, 0],
      [8, 2, 0, 1, 0, 0, 0, 4, 0],
      [0, 0, 4, 6, 0, 2, 9, 0, 0],
      [0, 5, 0, 0, 0, 3, 0, 2, 8],
      [0, 0, 9, 3, 0, 0, 0, 7, 4],
      [0, 4, 0, 0, 5, 0, 0, 3, 6],
      [7, 0, 3, 0, 1, 8, 0, 0, 0]
    ],
    [
      [0, 2, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 6, 0, 0, 0, 0, 3],
      [0, 7, 4, 0, 8, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 3, 0, 0, 2],
      [0, 8, 0, 0, 4, 0, 0, 1, 0],
      [6, 0, 0, 5, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 1, 0, 7, 8, 0],
      [5, 0, 0, 0, 0, 9, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 4, 0]
    ]
  ],
  Hard: [
    [
      [0, 2, 0, 6, 0, 8, 0, 0, 0],
      [5, 8, 0, 0, 0, 9, 7, 0, 0],
      [0, 0, 0, 0, 4, 0, 0, 0, 0],
      [3, 7, 0, 0, 0, 0, 5, 0, 0],
      [6, 0, 0, 0, 0, 0, 0, 0, 4],
      [0, 0, 8, 0, 0, 0, 0, 1, 3],
      [0, 0, 0, 0, 2, 0, 0, 0, 0],
      [0, 0, 9, 8, 0, 0, 0, 3, 6],
      [0, 0, 0, 3, 0, 6, 0, 9, 0]
    ],
    [
      [1, 0, 0, 0, 0, 7, 0, 9, 0],
      [0, 3, 0, 0, 2, 0, 0, 0, 8],
      [0, 0, 9, 6, 0, 0, 5, 0, 0],
      [0, 0, 5, 3, 0, 0, 9, 0, 0],
      [0, 1, 0, 0, 8, 0, 0, 2, 0],
      [0, 0, 6, 0, 0, 5, 1, 0, 0],
      [0, 0, 3, 0, 0, 9, 8, 0, 0],
      [9, 0, 0, 0, 4, 0, 0, 6, 0],
      [0, 5, 0, 1, 0, 0, 0, 0, 3]
    ]
  ],
  Expert: [
    [
      [0, 0, 0, 0, 0, 0, 0, 1, 2],
      [0, 0, 0, 0, 0, 0, 0, 0, 3],
      [0, 0, 2, 3, 0, 0, 4, 0, 0],
      [0, 0, 1, 8, 0, 0, 0, 0, 5],
      [0, 6, 0, 0, 7, 0, 0, 8, 0],
      [0, 0, 0, 0, 0, 9, 2, 0, 0],
      [0, 0, 8, 5, 0, 0, 6, 0, 0],
      [9, 0, 0, 0, 0, 0, 0, 0, 0],
      [4, 7, 0, 0, 0, 0, 0, 0, 0]
    ],
    [
      [0, 0, 0, 7, 0, 0, 0, 0, 0],
      [1, 0, 0, 0, 0, 0, 0, 0, 5],
      [0, 0, 8, 0, 3, 0, 2, 0, 0],
      [0, 5, 0, 0, 0, 1, 0, 0, 0],
      [4, 0, 0, 0, 0, 0, 0, 0, 6],
      [0, 0, 0, 5, 0, 0, 0, 7, 0],
      [0, 0, 2, 0, 6, 0, 1, 0, 0],
      [8, 0, 0, 0, 0, 0, 0, 0, 3],
      [0, 0, 0, 0, 0, 9, 0, 0, 0]
    ]
  ]
};

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

const isSudokuWon = (currentGrid: number[][]) => {
  if (!currentGrid || currentGrid.length !== 9) return false;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (currentGrid[r][c] === 0) return false;
    }
  }
  for (let i = 0; i < 9; i++) {
    const rowSet = new Set(currentGrid[i]);
    if (rowSet.size !== 9) return false;
    const colSet = new Set(currentGrid.map(row => row[i]));
    if (colSet.size !== 9) return false;
  }
  return true;
};

const getAIMove = (board: BoardState, difficulty: 'easy' | 'medium' | 'hard'): number => {
  const emptyIndices = board.map((val, idx) => (val === null ? idx : null)).filter((val) => val !== null) as number[];
  if (emptyIndices.length === 0) return -1;

  if (difficulty === 'easy') {
    return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  }

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

  const [sudokuDiff, setSudokuDiff] = useState<Difficulty>('Medium');
  const [grid, setGrid] = useState<number[][]>([]);
  const [initialGrid, setInitialGrid] = useState<number[][]>([]);
  const [notes, setNotes] = useState<Set<number>[][]>([]);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [isNotesMode, setIsNotesMode] = useState<boolean>(false);
  const [history, setHistory] = useState<{ grid: number[][]; notes: Set<number>[][] }[]>([]);
  const [mistakes, setMistakes] = useState<number>(0);
  const [hintsLeft, setHintsLeft] = useState<number>(5);

  useEffect(() => {
    loadSudokuLevel(sudokuDiff);
  }, [sudokuDiff]);

  const loadSudokuLevel = (diff: Difficulty) => {
    const boardsList = SUDOKU_BOARDS[diff];
    const randomIndex = Math.floor(Math.random() * boardsList.length);
    const template = boardsList[randomIndex];
    
    const newGrid = template.map(row => [...row]);
    setGrid(newGrid);
    setInitialGrid(template.map(row => [...row]));
    setNotes(Array(9).fill(0).map(() => Array(9).fill(0).map(() => new Set())));
    setHistory([]);
    setMistakes(0);
    setHintsLeft(5);
    setSelectedCell(null);
  };

  const saveHistory = () => {
    const gridCopy = grid.map(row => [...row]);
    const notesCopy = notes.map(row => row.map(cellSet => new Set(cellSet)));
    setHistory(prev => [...prev, { grid: gridCopy, notes: notesCopy }]);
  };

  const handleNumberInput = (num: number) => {
    if (!selectedCell || isSudokuWon(grid)) return;
    const [r, c] = selectedCell;
    if (initialGrid[r][c] !== 0) return;

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
    if (!selectedCell || isSudokuWon(grid)) return;
    const [r, c] = selectedCell;
    if (initialGrid[r][c] !== 0) return;

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
    if (hintsLeft <= 0 || !selectedCell || isSudokuWon(grid)) return;
    setHintsLeft(prev => prev - 1);
  };

  // --- X-O State ---
  const [xoBoard, setXoBoard] = useState<BoardState>(Array(9).fill(null));
  const [isVsAI, setIsVsAI] = useState<boolean>(true);
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isXNext, setIsXNext] = useState<boolean>(true);

  const winner = checkWinner(xoBoard);
  const sudokuWon = isSudokuWon(grid);

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
      <style>{`
        @keyframes bounceWin {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .win-banner {
          animation: bounceWin 0.4s ease-in-out forwards;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          padding: 12px;
          border-radius: 10px;
          text-align: center;
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 12px;
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
        <button onClick={() => setActiveTab('sudoku')} style={{ background: activeTab === 'sudoku' ? '#2196F3' : '#1e293b', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>Sudoku</button>
        <button onClick={() => setActiveTab('xo')} style={{ background: activeTab === 'xo' ? '#2196F3' : '#1e293b', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>X - O Game</button>
      </div>

      {activeTab === 'sudoku' ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
            {(['Easy', 'Medium', 'Hard', 'Expert'] as Difficulty[]).map(level => (
              <button
                key={level}
                onClick={() => setSudokuDiff(level)}
                style={{
                  background: sudokuDiff === level ? '#f59e0b' : '#1e293b',
                  color: '#fff',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '16px',
                  fontWeight: 'bold'
                }}
              >
                {level}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
            <span style={{ color: '#ef4444' }}>الأخطاء: {mistakes}/5</span>
            <button onClick={() => loadSudokuLevel(sudokuDiff)} style={{ background: '#334155', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '5px' }}>لعبة جديدة 🔄</button>
          </div>

          {sudokuWon && (
            <div className="win-banner">
              🎉 مبروك! لقد فزت في السودوكو بنجاح! 🎉
            </div>
          )}

          {/* Sudoku Grid with 3x3 Subgrid Borders */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', background: '#38bdf8', padding: '4px', borderRadius: '10px' }}>
            {[0, 1, 2].map(boxR =>
              [0, 1, 2].map(boxC => (
                <div key={`box-${boxR}-${boxC}`} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px', background: '#334155' }}>
                  {[0, 1, 2].map(r =>
                    [0, 1, 2].map(c => {
                      const rIdx = boxR * 3 + r;
                      const cIdx = boxC * 3 + c;
                      const val = grid[rIdx]?.[cIdx];
                      const isSelected = selectedCell?.[0] === rIdx && selectedCell?.[1] === cIdx;
                      const isFixed = initialGrid[rIdx]?.[cIdx] !== 0;
                      const cellNotes = Array.from(notes[rIdx]?.[cIdx] || []);
                      return (
                        <div
                          key={`${rIdx}-${cIdx}`}
                          onClick={() => setSelectedCell([rIdx, cIdx])}
                          style={{
                            aspectRatio: '1',
                            background: isSelected ? '#1e3a8a' : '#1e293b',
                            color: isFixed ? '#ffffff' : val ? '#38bdf8' : '#94a3b8',
                            fontWeight: isFixed ? 'bold' : 'normal',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px',
                            cursor: 'pointer'
                          }}
                        >
                          {val !== 0 ? val : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', fontSize: '7px', width: '100%', height: '100%', padding: '1px' }}>
                              {[1,2,3,4,5,6,7,8,9].map(n => (
                                <span key={n} style={{ textAlign: 'center', color: '#94a3b8' }}>{cellNotes.includes(n) ? n : ''}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              ))
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', marginTop: '15px' }}>
            {[1,2,3,4,5,6,7,8,9].map(n => (
              <button key={n} onClick={() => handleNumberInput(n)} style={{ background: '#1e293b', color: '#38bdf8', border: 'none', padding: '12px', fontSize: '18px', borderRadius: '6px', fontWeight: 'bold' }}>{n}</button>
            ))}
            <button onClick={handleErase} style={{ background: '#1e293b', color: '#f43f5e', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold' }}>مسح ⌫</button>
          </div>

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
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <button onClick={() => setIsVsAI(true)} style={{ flex: 1, background: isVsAI ? '#0284c7' : '#1e293b', color: '#fff', padding: '10px', border: 'none', borderRadius: '6px' }}>ضد الذكاء الاصطناعي 🤖</button>
            <button onClick={() => setIsVsAI(false)} style={{ flex: 1, background: !isVsAI ? '#0284c7' : '#1e293b', color: '#fff', padding: '10px', border: 'none', borderRadius: '6px' }}>لاعبين 👥</button>
          </div>

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
                    borderRadius: '20px'
                  }}
                >
                  {level === 'easy' ? 'سهل' : level === 'medium' ? 'متوسط' : 'صعب'}
                </button>
              ))}
            </div>
          )}

          {winner && (
            <div className="win-banner">
              {winner === 'Tie' ? 'تعادل!' : `🎉 الفائز هو: ${winner} 🎉`}
            </div>
          )}

          <div style={{ textAlign: 'center', marginBottom: '10px', fontSize: '18px' }}>
            {winner ? (winner === 'Tie' ? 'تعادل!' : `الفائز: ${winner}`) : `دور اللاعب: ${isXNext ? 'X' : 'O'}`}
          </div>

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
