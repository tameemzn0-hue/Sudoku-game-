import React, { useState, useEffect, useCallback } from 'react';

type Screen = 'home' | 'sudoku' | 'xo';
type SudokuDiff = 'Easy' | 'Medium' | 'Hard' | 'Expert';
type XOMode = '2P' | 'AI';
type Player = 'X' | 'O';

// --- محرك لعبة السودوكو (Sudoku Engine) ---
function solveSudoku(board: number[][]): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) {
        let nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
        for (let num of nums) {
          if (isValidSudoku(board, r, c, num)) {
            board[r][c] = num;
            if (solveSudoku(board)) return true;
            board[r][c] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function isValidSudoku(board: number[][], r: number, c: number, num: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (board[r][i] === num && i !== c) return false;
    if (board[i][c] === num && i !== r) return false;
    let boxR = 3 * Math.floor(r / 3) + Math.floor(i / 3);
    let boxC = 3 * Math.floor(c / 3) + (i % 3);
    if (board[boxR][boxC] === num && (boxR !== r || boxC !== c)) return false;
  }
  return true;
}

function generateSudokuPuzzle(diff: SudokuDiff) {
  let solution: number[][] = Array(9).fill(0).map(() => Array(9).fill(0));
  solveSudoku(solution);

  let puzzle: number[][] = solution.map(row => [...row]);
  let removes = diff === 'Easy' ? 30 : diff === 'Medium' ? 40 : diff === 'Hard' ? 50 : 58;

  let count = 0;
  while (count < removes) {
    let r = Math.floor(Math.random() * 9);
    let c = Math.floor(Math.random() * 9);
    if (puzzle[r][c] !== 0) {
      puzzle[r][c] = 0;
      count++;
    }
  }
  return { puzzle, solution };
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');

  // --- حالات السودوكو ---
  const [sudokuDiff, setSudokuDiff] = useState<SudokuDiff>('Medium');
  const [initialBoard, setInitialBoard] = useState<number[][]>([]);
  const [currentBoard, setCurrentBoard] = useState<number[][]>([]);
  const [solutionBoard, setSolutionBoard] = useState<number[][]>([]);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [timer, setTimer] = useState<number>(0);
  const [isSudokuWon, setIsSudokuWon] = useState<boolean>(false);
  const [isSudokuGameOver, setIsSudokuGameOver] = useState<boolean>(false);
  const [mistakesCount, setMistakesCount] = useState<number>(0);
  const [hintsLeft, setHintsLeft] = useState<number>(5);

  const startNewSudokuGame = useCallback((diff: SudokuDiff) => {
    const { puzzle, solution } = generateSudokuPuzzle(diff);
    setInitialBoard(puzzle.map(row => [...row]));
    setCurrentBoard(puzzle.map(row => [...row]));
    setSolutionBoard(solution);
    setSelectedCell(null);
    setTimer(0);
    setIsSudokuWon(false);
    setIsSudokuGameOver(false);
    setMistakesCount(0);
    setHintsLeft(5);
  }, []);

  useEffect(() => {
    if (screen === 'sudoku' && currentBoard.length === 0) {
      startNewSudokuGame(sudokuDiff);
    }
  }, [screen, sudokuDiff, currentBoard.length, startNewSudokuGame]);

  useEffect(() => {
    let interval: any;
    if (screen === 'sudoku' && !isSudokuWon && !isSudokuGameOver) {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [screen, isSudokuWon, isSudokuGameOver]);

  const handleSudokuInput = (num: number) => {
    if (!selectedCell || isSudokuWon || isSudokuGameOver) return;
    const [r, c] = selectedCell;
    if (initialBoard[r][c] !== 0) return;

    const newBoard = currentBoard.map(row => [...row]);
    newBoard[r][c] = num;
    setCurrentBoard(newBoard);

    // فحص الأخطاء
    if (num !== solutionBoard[r][c]) {
      const nextMistakes = mistakesCount + 1;
      setMistakesCount(nextMistakes);
      if (nextMistakes >= 5) {
        setIsSudokuGameOver(true);
        return;
      }
    }

    // التحقق من الفوز
    let complete = true;
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (newBoard[i][j] !== solutionBoard[i][j]) {
          complete = false;
          break;
        }
      }
    }
    if (complete) setIsSudokuWon(true);
  };

  const handleSudokuErase = () => {
    if (!selectedCell || isSudokuWon || isSudokuGameOver) return;
    const [r, c] = selectedCell;
    if (initialBoard[r][c] !== 0) return;

    const newBoard = currentBoard.map(row => [...row]);
    newBoard[r][c] = 0;
    setCurrentBoard(newBoard);
  };

  const handleSudokuHint = () => {
    if (hintsLeft <= 0 || isSudokuWon || isSudokuGameOver) return;

    let targetR = -1, targetC = -1;
    if (selectedCell) {
      const [r, c] = selectedCell;
      if (currentBoard[r][c] !== solutionBoard[r][c] && initialBoard[r][c] === 0) {
        targetR = r;
        targetC = c;
      }
    }

    if (targetR === -1) {
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (currentBoard[r][c] !== solutionBoard[r][c] && initialBoard[r][c] === 0) {
            targetR = r;
            targetC = c;
            break;
          }
        }
        if (targetR !== -1) break;
      }
    }

    if (targetR !== -1) {
      const newBoard = currentBoard.map(row => [...row]);
      newBoard[targetR][targetC] = solutionBoard[targetR][targetC];
      setCurrentBoard(newBoard);
      setSelectedCell([targetR, targetC]);
      setHintsLeft(h => h - 1);

      let complete = true;
      for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
          if (newBoard[i][j] !== solutionBoard[i][j]) {
            complete = false;
            break;
          }
        }
      }
      if (complete) setIsSudokuWon(true);
    }
  };

  // --- حالات X - O ---
  const [xoBoard, setXoBoard] = useState<(Player | null)[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<Player>('X');
  const [xoMode, setXoMode] = useState<XOMode>('2P');
  const [winner, setWinner] = useState<Player | 'Draw' | null>(null);

  const winLines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  const checkXOWinner = (board: (Player | null)[]) => {
    for (let line of winLines) {
      const [a, b, c] = line;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    if (board.every(cell => cell !== null)) return 'Draw';
    return null;
  };

  const handleXOClick = (index: number) => {
    if (xoBoard[index] || winner) return;

    const newBoard = [...xoBoard];
    newBoard[index] = turn;
    setXoBoard(newBoard);

    const gameResult = checkXOWinner(newBoard);
    if (gameResult) {
      setWinner(gameResult);
    } else {
      setTurn(turn === 'X' ? 'O' : 'X');
    }
  };

  useEffect(() => {
    if (xoMode === 'AI' && turn === 'O' && !winner && screen === 'xo') {
      const emptyIndices = xoBoard
        .map((val, idx) => (val === null ? idx : null))
        .filter((val): val is number => val !== null);

      if (emptyIndices.length > 0) {
        const timer = setTimeout(() => {
          const randomIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
          handleXOClick(randomIndex);
        }, 350);
        return () => clearTimeout(timer);
      }
    }
  }, [turn, xoMode, winner, xoBoard, screen]);

  const resetXO = () => {
    setXoBoard(Array(9).fill(null));
    setTurn('X');
    setWinner(null);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-3 font-sans select-none">
      
      {/* 1. الشاشة الرئيسية (Games TA Hub) */}
      {screen === 'home' && (
        <div className="w-full max-w-sm text-center space-y-8 animate-fade-in">
          <div className="space-y-2">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30 mb-2">
              <span className="text-3xl font-black tracking-wider text-white">TA</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white">Games TA</h1>
            <p className="text-slate-400 text-sm font-medium">منصة الألعاب المجمعة الخاصة بك</p>
          </div>

          <div className="space-y-4 pt-2">
            {/* كارت لعبة السودوكو */}
            <button
              onClick={() => setScreen('sudoku')}
              className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 flex items-center justify-between transition-all active:scale-95 shadow-md group"
            >
              <div className="flex items-center space-x-4 space-x-reverse text-right">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-2xl font-bold group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors">
                  🧩
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">سودوكو (Sudoku)</h3>
                  <p className="text-xs text-slate-400">لعبة الأرقام والتركيز الشهيرة</p>
                </div>
              </div>
              <span className="text-slate-500 group-hover:text-cyan-400 transition-colors">←</span>
            </button>

            {/* كارت لعبة X - O */}
            <button
              onClick={() => { resetXO(); setScreen('xo'); }}
              className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 flex items-center justify-between transition-all active:scale-95 shadow-md group"
            >
              <div className="flex items-center space-x-4 space-x-reverse text-right">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-2xl font-bold group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                  ❌⭕
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">لعبة X - O</h3>
                  <p className="text-xs text-slate-400">تحدي الذكاء التكتيكي الكلاسيكي</p>
                </div>
              </div>
              <span className="text-slate-500 group-hover:text-amber-400 transition-colors">←</span>
            </button>
          </div>

          <div className="pt-8 text-xs text-slate-600 font-semibold">
            الإصدار 2.0.0 • صُمم بواسطة TA
          </div>
        </div>
      )}

      {/* 2. شاشة لعبة السودوكو الكاملة */}
      {screen === 'sudoku' && (
        <div className="w-full max-w-sm flex flex-col items-center space-y-3">
          <div className="w-full flex justify-between items-center pb-2 border-b border-slate-800">
            <button
              onClick={() => setScreen('home')}
              className="text-xs font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl transition-all"
            >
              ← القائمة الرئيسية
            </button>

            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="text-xs font-bold text-rose-400 bg-rose-950/40 px-2 py-1 rounded-lg border border-rose-800/40">
                ❌ الأخطاء: {mistakesCount}/5
              </div>
              <div className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/40 px-2.5 py-1 rounded-lg border border-cyan-800/40">
                ⏱️ {formatTime(timer)}
              </div>
            </div>
          </div>

          {/* حالة اللعبة (فوز أو خسارة) */}
          {isSudokuWon && (
            <div className="w-full p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-center font-bold text-emerald-400 text-sm">
              🎉 مبروك! حللت السودوكو بنجاح!
            </div>
          )}
          {isSudokuGameOver && (
            <div className="w-full p-2.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-center font-bold text-rose-400 text-sm">
              ❌ انتهت اللعبة! تجاوزت 5 أخطاء.
            </div>
          )}

          {/* تبويب اختيار المستويات */}
          <div className="flex w-full bg-slate-900 p-1 rounded-2xl border border-slate-800 gap-1">
            {(['Easy', 'Medium', 'Hard', 'Expert'] as SudokuDiff[]).map((d) => (
              <button
                key={d}
                onClick={() => {
                  setSudokuDiff(d);
                  startNewSudokuGame(d);
                }}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                  sudokuDiff === d
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* لوحة شبكة السودوكو 9x9 */}
          <div className="w-full aspect-square bg-slate-900 p-1.5 rounded-2xl border border-slate-800 grid grid-cols-9 gap-0.5 shadow-xl">
            {currentBoard.map((row, r) =>
              row.map((val, c) => {
                const isFixed = initialBoard[r] && initialBoard[r][c] !== 0;
                const isSelected = selectedCell && selectedCell[0] === r && selectedCell[1] === c;
                const isSameRowCol = selectedCell && (selectedCell[0] === r || selectedCell[1] === c);
                const isError = val !== 0 && !isFixed && solutionBoard[r] && val !== solutionBoard[r][c];

                const borderRight = (c + 1) % 3 === 0 && c < 8 ? 'border-r-2 border-r-slate-700' : '';
                const borderBottom = (r + 1) % 3 === 0 && r < 8 ? 'border-b-2 border-b-slate-700' : '';

                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => setSelectedCell([r, c])}
                    className={`flex items-center justify-center font-bold text-base rounded transition-all ${borderRight} ${borderBottom} ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 ring-2 ring-cyan-300'
                        : isError
                        ? 'bg-rose-500/30 text-rose-300 font-extrabold'
                        : isSameRowCol
                        ? 'bg-slate-800/80'
                        : 'bg-slate-950/60'
                    } ${isFixed ? 'text-slate-200 font-extrabold' : 'text-cyan-400'}`}
                  >
                    {val !== 0 ? val : ''}
                  </button>
                );
              })
            )}
          </div>

          {/* لوحة إدخال الأرقام (Keypad) والتلميحات والمسح */}
          <div className="grid grid-cols-5 gap-1.5 w-full pt-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button
                key={n}
                onClick={() => handleSudokuInput(n)}
                disabled={isSudokuWon || isSudokuGameOver}
                className="py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-cyan-400 font-bold text-lg active:scale-95 transition-all disabled:opacity-50"
              >
                {n}
              </button>
            ))}
            <button
              onClick={handleSudokuErase}
              disabled={isSudokuWon || isSudokuGameOver}
              className="py-2.5 bg-slate-900 hover:bg-rose-950/30 border border-slate-800 rounded-xl text-rose-400 font-bold text-xs active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center"
            >
              ⌫ مسح
            </button>
          </div>

          {/* أدوات التحكم الإضافية (زر التلميح وزر إعادة اللعب) */}
          <div className="flex w-full gap-2 pt-1">
            <button
              onClick={handleSudokuHint}
              disabled={hintsLeft <= 0 || isSudokuWon || isSudokuGameOver}
              className="flex-1 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-xl text-xs font-bold active:scale-95 transition-all disabled:opacity-40"
            >
              💡 تلميح ({hintsLeft} متبقية)
            </button>
            <button
              onClick={() => startNewSudokuGame(sudokuDiff)}
              className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold active:scale-95 transition-all"
            >
              لعبة جديدة 🔄
            </button>
          </div>
        </div>
      )}

      {/* 3. شاشة لعبة X - O */}
      {screen === 'xo' && (
        <div className="w-full max-w-sm flex flex-col items-center space-y-6 animate-fade-in">
          <div className="w-full flex justify-between items-center pb-2 border-b border-slate-800">
            <button
              onClick={() => setScreen('home')}
              className="text-xs font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl transition-all"
            >
              ← القائمة الرئيسية
            </button>
            <span className="text-sm font-black text-amber-400 tracking-wide">X - O GAME</span>
          </div>

          <div className="flex w-full bg-slate-900 p-1 rounded-2xl border border-slate-800 gap-1">
            <button
              onClick={() => { setXoMode('2P'); resetXO(); }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                xoMode === '2P' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400'
              }`}
            >
              👥 لاعبين
            </button>
            <button
              onClick={() => { setXoMode('AI'); resetXO(); }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                xoMode === 'AI' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400'
              }`}
            >
              🤖 ضد الذكاء الاصطناعي
            </button>
          </div>

          <div className="text-center font-bold text-lg h-6">
            {winner ? (
              winner === 'Draw' ? (
                <span className="text-amber-400">تعادل! 🤝</span>
              ) : (
                <span className="text-emerald-400">الفائز هو {winner}! 🎉</span>
              )
            ) : (
              <span className="text-slate-300">
                دور اللاعب: <span className={turn === 'X' ? 'text-cyan-400' : 'text-amber-400'}>{turn}</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 w-full aspect-square bg-slate-900 p-3 rounded-3xl border border-slate-800 shadow-xl">
            {xoBoard.map((cell, idx) => (
              <button
                key={idx}
                onClick={() => handleXOClick(idx)}
                className={`rounded-2xl text-4xl font-black flex items-center justify-center transition-all active:scale-95 ${
                  cell === 'X'
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                    : cell === 'O'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    : 'bg-slate-950/60 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {cell}
              </button>
            ))}
          </div>

          <button
            onClick={resetXO}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-2xl text-sm font-bold text-slate-300 transition-all active:scale-95"
          >
            إعادة اللعب 🔄
          </button>
        </div>
      )}

    </div>
  );
}
