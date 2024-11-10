export interface SxssConfig {
  input: {
    tabSize: number
  },
  output: {
    indentType: 'tab' | 'space'
    tabSize: number
    endOfLine: string
  }
}

export interface Line {
  rawExists: boolean
  isIgnorable: boolean
  raw: string
  rawIndentSpace: number
  indentLevel: number
  lineNo: number
  content: string
  contentLineNo: number
}

const countIndent = (raw: string, tabSize: number) => {
  let countChar = 0
  let countSpace = 0
  for (const letter of raw) {
    if (letter == '\t') {
      countChar++
      countSpace += tabSize
    }
    else if (letter == ' ') {
      countChar++
      countSpace++
    }
    else break
  }

  return {
    countChar,
    countSpace,
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
    public config: SxssConfig,
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

  findPrevIndex(i: number, condition: (p: number) => boolean = () => true) {
    for (let p = i - 1; p >= 0; p--) {
      if (condition(p)) return p
    }
  }

  findNextIndex(i: number, condition: (n: number) => boolean = () => true) {
    for (let n = i + 1; n < this.lines.length; n++) {
      if (condition(n)) return n
    }
  }

  parse(content: string) {
    const tabSize = this.config.input.tabSize
    const rawLines = content.split('\n').map((line) => line.trimEnd())

    const indentStack: number[] = [0]
    const getIndent = (i: number = 0) => indentStack[i >= 0 ? i : indentStack.length + i]
    let indentLevel = 0

    for (const [i, raw] of rawLines.entries()) {
      const { countSpace, countChar } = countIndent(raw, tabSize)
      const trimmed = raw.slice(countChar)

      if (countSpace > getIndent(-1)) {
        indentStack.push(countSpace)
        indentLevel++
      }

      while (countSpace < getIndent(-1)) {
        if (indentStack.length > 1) {
          indentStack.pop()
        }
        indentLevel--
        indentStack[indentStack.length - 1] = countSpace
      }

      this.lines.push({
        rawExists: true,
        isIgnorable: /^[\t ]*$/.test(trimmed),
        raw,
        rawIndentSpace: countSpace,
        indentLevel,
        lineNo: i,
        content: trimmed,
        contentLineNo: i,
      })
    }

    return this
  }

  process<T extends object = object, U extends object = object>(
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

  join(lineProcessor: (indented: string, line: Line) => string = (indented) => indented) {
    return this.lines
      .map((line) => {
        const indented = `${this.indent(line.indentLevel)}${line.content}`
        const processed = lineProcessor(indented, line)
        return processed
      })
      .join(this.config.output.endOfLine)
  }
}
