import { PartialDeep } from 'type-fest'

export interface Line {
  rawExists: boolean
  isIgnorable: boolean
  raw: string
  rawTrimmed: string
  rawIndent: number
  indentLevel: number
  lineNo: number
  modified: string
  modifiedLineNo: number
}

interface InsertSbConfig {
  input: {
    tabSize: number
  },
  output: {
    indentType: 'tab' | 'space'
    tabSize: number
    endOfLine: string
  }
}

const countIndent = (raw: string, tabSize: number) => {
  let countRaw = 0
  let count = 0
  for (const letter of raw) {
    if (letter == '\t') {
      countRaw++
      count += tabSize
    }
    else if (letter == ' ') {
      countRaw++
      count++
    }
    else break
  }

  return {
    count,
    trimmed: raw.substring(countRaw),
  }
}

const parseLines = (content: string, config: InsertSbConfig) => {
  const rawLines = content.split('\n').map((line) => line.trimEnd())
  const lines: Line[] = []

  const indentStack: number[] = [0]
  const getIndent = (i: number = 0) => indentStack[i >= 0 ? i : indentStack.length + i]
  const getIndentLevel = () => indentStack.length - 1

  for (const [i, raw] of rawLines.entries()) {
    const { count: rawIndent, trimmed } = countIndent(raw, config.input.tabSize)
    const isEmptyLine = /^[\t ]*$/.test(raw)
    const isLineComment = /^[\t ]*\/\/.*/.test(raw)
    const isIgnorable = isEmptyLine || isLineComment

    if (!isIgnorable) {
      if (rawIndent > getIndent(-1)) {
        indentStack.push(rawIndent)
      }

      while (rawIndent < getIndent(-1)) {
        indentStack.pop()
      }
    }

    lines.push({
      rawExists: true,
      isIgnorable,
      raw,
      rawIndent,
      rawTrimmed: trimmed,
      indentLevel: getIndentLevel(),
      lineNo: i,
      modified: raw,
      modifiedLineNo: i,
    })
  }

  return lines
}

const getIndentChar = (output: InsertSbConfig['output']) => {
  switch (output.indentType) {
    case 'space':
      return ' '.repeat(output.tabSize)
    case 'tab':
      return '\t'
  }
}

const modifyLines = (lines: Line[], config: InsertSbConfig) => {
  const indentChar = getIndentChar(config.output)
  let offset = 0
  // TODO: work with block comments
  // let isBlockComment = false

  const indent = (level: number) => indentChar.repeat(level)

  const findNextLine = (i: number) => {
    for (let n = i + 1; n < lines.length; n++) {
      if (!lines[n].isIgnorable) return { n, nextLine: lines[n] }
    }
  }

  const findPrevLine = (i: number) => {
    for (let p = i - 1; p >= 0; p--) {
      if (!lines[p].isIgnorable) return { p, prevLine: lines[p] }
    }
  }

  const insertClosingBrackets = (initialIndex: number, initialLine: Line, delta: number) => {
    for (let j = 0; j < delta; j++) {
      const level = initialLine.indentLevel - j - 1

      lines.splice(initialIndex + 1 + j, 0, {
        rawExists: false,
        isIgnorable: false,
        raw: '',
        rawTrimmed: '',
        rawIndent: 0,
        indentLevel: level,
        lineNo: initialLine.lineNo,
        modified: `${indent(level)}}`,
        modifiedLineNo: initialLine.lineNo + j + 1,
      })
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.isIgnorable) {
      line.modifiedLineNo = line.lineNo + offset
      continue
    } else /* if (isBlockComment) {
      line.modifiedLineNo = line.lineNo + offset
      continue
    } else */ {
      line.modified = `${indent(line.indentLevel)}${line.rawTrimmed}`
    }

    let isProperty = true

    const nextLineFound = findNextLine(i)

    if (nextLineFound) {
      const { nextLine } = nextLineFound

      if (line.indentLevel < nextLine.indentLevel) {
        isProperty = false
        line.modified = `${line.modified} {`
      }
    }

    const prevLineFound = findPrevLine(i)

    if (prevLineFound) {
      const { p, prevLine } = prevLineFound

      if (line.indentLevel < prevLine.indentLevel) {
        isProperty = false
        const delta = prevLine.indentLevel - line.indentLevel
        insertClosingBrackets(p, prevLine, delta)

        i += delta
        offset += delta
      }
    }

    if (isProperty) {
      line.modified = `${line.modified};`
    }

    line.modifiedLineNo = line.lineNo + offset
  }

  const lastLineFound = findPrevLine(lines.length - 1)

  if (lastLineFound) {
    const { p, prevLine: lastLine } = lastLineFound
    insertClosingBrackets(p, lastLine, lastLine.indentLevel)
  }

  return lines
}

const joinLines = (lines: Line[], config: InsertSbConfig) => {
  return lines.map((line) => line.modified).join(config.output.endOfLine)
}

export const insertSb = (content: string, options?: PartialDeep<InsertSbConfig>) => {
  const config: InsertSbConfig = {
    input: {
      tabSize: 2,
      ...options?.input,
    },
    output: {
      indentType: 'space',
      tabSize: 2,
      endOfLine: '\n',
      ...options?.output,
    },
  }

  const lines = parseLines(content, config)
  const modifiedLines = modifyLines(lines, config)
  const inserted = joinLines(modifiedLines, config)

  return inserted
}

const inserted = insertSb(`
.r
  transition:
    name: color
    duration: 1s

  .g
    color: green

.b
  color: blue
`)

console.log(inserted)
