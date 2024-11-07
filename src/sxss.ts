import { InsertSbConfig } from './insert-sb'

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

interface LineIterator {
  i: number
}

interface LineHandler extends LineIterator {
  continue: boolean
  return: boolean
}

export default class Sxss {
  public lines: Line[] = []
  public indentChar: string

  constructor(
    public config: InsertSbConfig,
  ) {
    this.indentChar = this._getIndentChar()
  }

  private _getIndentChar() {
    switch (this.config.output.indentType) {
      case 'space':
        return ' '.repeat(this.config.output.tabSize)
      case 'tab':
        return '\t'
    }
  }

  indent(level: number) {
    return this.indentChar.repeat(level)
  }

  findPrevIndex(i: number) {
    for (let p = i - 1; p >= 0; p--) {
      if (!this.lines[p].isIgnorable) return p
    }
  }

  findNextIndex(i: number) {
    for (let n = i + 1; n < this.lines.length; n++) {
      if (!this.lines[n].isIgnorable) return n
    }
  }

  parse(content: string) {
    const tabSize = this.config.input.tabSize
    const rawLines = content.split('\n').map((line) => line.trimEnd())

    const indentStack: number[] = [0]
    const getIndent = (i: number = 0) => indentStack[i >= 0 ? i : indentStack.length + i]
    const getIndentLevel = () => indentStack.length - 1

    for (const [i, raw] of rawLines.entries()) {
      const { count: rawIndent, trimmed } = countIndent(raw, tabSize)
      const isIgnorable = /^[\t ]*[\/\/.*]?$/.test(raw)

      if (!isIgnorable) {
        if (rawIndent > getIndent(-1)) {
          indentStack.push(rawIndent)
        }

        while (rawIndent < getIndent(-1)) {
          indentStack.pop()
        }
      }

      this.lines.push({
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

    return this
  }

  process<T extends object, U extends object>(
    setup: T | (() => T),
    lineSetup: U | (() => U),
    lineProcessors: ((line: Line, vars: T & U & LineHandler) => Partial<T & U & LineHandler> | void)[] = [],
    postProcessors: ((vars: T) => Partial<T> | void)[] = [],
  ) {
    let vars: T & LineIterator = {
      ...typeof setup == 'function' ? setup() : setup,
      i: 0,
    }

    let earlyReturn = false

    for (vars.i = 0; vars.i < this.lines.length; vars.i++) {
      let lineVars: T & U & LineHandler = {
        ...vars,
        continue: false,
        return: false,
        ...typeof lineSetup == 'function' ? lineSetup() : lineSetup,
      }

      for (const lineProcessor of lineProcessors) {
        const mutation = lineProcessor(this.lines[vars.i], lineVars)
        lineVars = { ...lineVars, ...mutation }

        if (lineVars.continue) {
          break
        }
        if (lineVars.return) {
          earlyReturn = true
          break
        }

        delete mutation?.continue
        delete mutation?.return
        vars = { ...vars, ...mutation }
      }

      if (earlyReturn) {
        break
      }
    }

    for (const postProcessor of postProcessors) {
      const mutation = postProcessor(vars)
      vars = { ...vars, ...mutation }
    }

    return this
  }

  join() {
    return this.lines.map((line) => line.modified).join(this.config.output.endOfLine)
  }
}
