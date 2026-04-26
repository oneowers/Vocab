export function levenshtein(left: string, right: string) {
  const a = left.trim().toLowerCase()
  const b = right.trim().toLowerCase()

  if (a === b) {
    return 0
  }

  if (!a.length) {
    return b.length
  }

  if (!b.length) {
    return a.length
  }

  const matrix = Array.from({ length: b.length + 1 }, () =>
    Array.from({ length: a.length + 1 }, () => 0)
  )

  for (let row = 0; row <= b.length; row += 1) {
    matrix[row][0] = row
  }

  for (let column = 0; column <= a.length; column += 1) {
    matrix[0][column] = column
  }

  for (let row = 1; row <= b.length; row += 1) {
    for (let column = 1; column <= a.length; column += 1) {
      const substitutionCost = a[column - 1] === b[row - 1] ? 0 : 1
      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + substitutionCost
      )
    }
  }

  return matrix[b.length][a.length]
}

