import { PartialDeep } from 'type-fest'
import Sxss from './sxss'

export interface InsertSbConfig {
  input: {
    tabSize: number
  },
  output: {
    indentType: 'tab' | 'space'
    tabSize: number
    endOfLine: string
  }
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

  const sxss = new Sxss(config)
  sxss.parse(content)

  const insertClosingBrackets = (p: number, delta: number) => {
    const prevLine = sxss.lines[p]

    for (let j = 0; j < delta; j++) {
      const level = prevLine.indentLevel - j - 1

      sxss.lines.splice(p + 1 + j, 0, {
        rawExists: false,
        isIgnorable: false,
        raw: '',
        rawTrimmed: '',
        rawIndent: 0,
        indentLevel: level,
        lineNo: prevLine.lineNo,
        modified: `${sxss.indent(level)}}`,
        modifiedLineNo: prevLine.lineNo + j + 1,
      })
    }
  }

  interface ProcessVars1 {
    offset: number
    isBlockComment: boolean
  }

  interface ProcessLineVars1 {
    isStatement: boolean
  }

  sxss.process<ProcessVars1, ProcessLineVars1>({
    offset: 0,
    isBlockComment: false,
  }, {
    isStatement: true,
  }, [
    (line, { offset }) => {
      if (line.isIgnorable) {
        line.modifiedLineNo = line.lineNo + offset
        return { continue: true }
      } /* else if (isBlockComment) {
        line.modifiedLineNo = line.lineNo + offset
        continue
      } */ else {
        line.modified = `${sxss.indent(line.indentLevel)}${line.rawTrimmed}`
      }
    },
    (line) => {
      if (line.raw.endsWith(',')) {
        return { isStatement: false }
      }
    },
    (line, { i }) => {
      const n = sxss.findNextIndex(i)
      if (!n) return

      const nextLine = sxss.lines[n]

      if (line.indentLevel < nextLine.indentLevel) {
        line.modified = `${line.modified} {`
        return { isStatement: false }
      }
    },
    (line, { i, offset }) => {
      const p = sxss.findPrevIndex(i)
      if (!p) return

      const prevLine = sxss.lines[p]

      if (line.indentLevel < prevLine.indentLevel) {
        const delta = prevLine.indentLevel - line.indentLevel
        insertClosingBrackets(p, delta)

        return {
          isStatement: false,
          i: i += delta,
          offset: offset += delta,
        }
      }
    },
    (line, { isStatement }) => {
      if (isStatement) {
        line.modified = `${line.modified};`
      }
    },
  ], [
    () => {
      const l = sxss.findPrevIndex(sxss.lines.length - 1)
      if (!l) return

      const lastLine = sxss.lines[l]
      insertClosingBrackets(l, lastLine.indentLevel)
    },
  ])

  // modifyLines(sxss.lines, config)
  return sxss.join()
}

// const modified = insertSb(`
// .r
//   transition:
//     name: color
//     duration: 1s

//   .g
//     color: green

// .b
//   color: blue
// `)

// console.log(modified)
