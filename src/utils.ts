export const firstMatched = (result: RegExpExecArray | RegExpMatchArray) => {
  const { index, 0: str } = result
  const start = index ?? 0
  return {
    str,
    start,
    end: start + str.length,
    length: str.length,
  }
}
