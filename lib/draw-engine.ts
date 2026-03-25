export type DrawMode = 'random' | 'algorithmic'

export function generateDrawNumbers(mode: DrawMode, scoreFreq: Record<number, number> = {}): number[] {
  if (mode === 'random' || Object.keys(scoreFreq).length === 0) {
    return generateRandom()
  }
  return generateAlgorithmic(scoreFreq)
}

function generateRandom(): number[] {
  const nums = new Set<number>()
  while (nums.size < 5) nums.add(Math.floor(Math.random() * 45) + 1)
  return Array.from(nums).sort((a, b) => a - b)
}

function generateAlgorithmic(freq: Record<number, number>): number[] {
  const total = Object.values(freq).reduce((a, b) => a + b, 0)
  const weights = Array.from({ length: 45 }, (_, i) => ({
    n: i + 1,
    w: freq[i + 1] ? (freq[i + 1] / total) * 100 : 0.5,
  }))
  const picked = new Set<number>()
  while (picked.size < 5) {
    const remaining = weights.filter(w => !picked.has(w.n))
    const sum = remaining.reduce((a, b) => a + b.w, 0)
    let r = Math.random() * sum
    for (const item of remaining) {
      r -= item.w
      if (r <= 0) { picked.add(item.n); break }
    }
  }
  return Array.from(picked).sort((a, b) => a - b)
}

export function checkMatch(userNums: number[], drawNums: number[]) {
  const matched = userNums.filter(n => drawNums.includes(n))
  const count = matched.length
  const tier = count === 5 ? '5-match' : count === 4 ? '4-match' : count === 3 ? '3-match' : null
  return { matched, count, tier }
}
