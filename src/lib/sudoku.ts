export type CellValue = number | null;
export type Grid = CellValue[][];

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export const DIFFICULTY_CELLS: Record<Difficulty, number> = {
  easy: 38,
  medium: 32,
  hard: 27,
  expert: 22,
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function isValid(grid: Grid, row: number, col: number, num: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (grid[row][i] === num) return false;
    if (grid[i][col] === num) return false;
  }
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++) {
    for (let c = bc; c < bc + 3; c++) {
      if (grid[r][c] === num) return false;
    }
  }
  return true;
}

function fillGrid(grid: Grid): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === null) {
        const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (const num of nums) {
          if (isValid(grid, row, col, num)) {
            grid[row][col] = num;
            if (fillGrid(grid)) return true;
            grid[row][col] = null;
          }
        }
        return false;
      }
    }
  }
  return true;
}

export function generateSolved(): Grid {
  const grid: Grid = Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => null)
  );
  fillGrid(grid);
  return grid;
}

export function generatePuzzle(difficulty: Difficulty): { puzzle: Grid; solution: Grid } {
  const solution = generateSolved();
  const puzzle: Grid = solution.map((row) => [...row]);
  const cellsToRemove = 81 - DIFFICULTY_CELLS[difficulty];

  const positions = shuffle(
    Array.from({ length: 81 }, (_, i) => i)
  );

  let removed = 0;
  for (const pos of positions) {
    if (removed >= cellsToRemove) break;
    const row = Math.floor(pos / 9);
    const col = pos % 9;
    puzzle[row][col] = null;
    removed++;
  }

  return { puzzle, solution };
}

export function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => [...row]);
}

export function isSolved(grid: Grid, solution: Grid): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] !== solution[r][c]) return false;
    }
  }
  return true;
}

export function findConflicts(
  grid: Grid,
  row: number,
  col: number,
  value: number
): Array<[number, number]> {
  const conflicts: Array<[number, number]> = [];
  if (value === null) return conflicts;

  for (let i = 0; i < 9; i++) {
    if (i !== col && grid[row][i] === value) conflicts.push([row, i]);
    if (i !== row && grid[i][col] === value) conflicts.push([i, col]);
  }
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++) {
    for (let c = bc; c < bc + 3; c++) {
      if ((r !== row || c !== col) && grid[r][c] === value)
        conflicts.push([r, c]);
    }
  }
  return conflicts;
}
