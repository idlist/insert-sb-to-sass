import { PartialDeep } from 'type-fest'
import Sxss, { type SxssConfig } from './sxss'
import { firstMatched } from './utils'

export interface InsertSbConfig extends SxssConfig {
}

declare module './sxss' {
  interface Line {
    commentTrailing?: string
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

  interface ProcessVarsComment {
    blockCommentStartIndex?: number
    indentLevelOffset: number
  }

  interface ProcessLineVarsComment {
  }

  sxss.process<ProcessVarsComment, ProcessLineVarsComment>({
    indentLevelOffset: 0,
  }, {}, [
    // Process indented comments.
    (line, { blockCommentStartIndex, indentLevelOffset }) => {
      if (!blockCommentStartIndex) return
      const startLine = sxss.lines[blockCommentStartIndex]

      if (line.rawIndentSpace > startLine.rawIndentSpace) {
        line.indentLevel = startLine.indentLevel + 1
        line.isIgnorable = true
        return { continue: true }
      } else {
        const delta = startLine.indentLevel - line.indentLevel
        return {
          blockCommentStartIndex: undefined,
          indentLevelOffset: indentLevelOffset += delta,
        }
      }
    },
    // Adjust indent level offset caused by indentation inside comments.
    (line, { indentLevelOffset }) => {
      line.indentLevel += indentLevelOffset
    },
    // Process multi-line comments.
    (line, { i }) => {
      let rest = line.content
      let hasBlockComment = false
      let hasContent = false

      while (rest) {
        const hasLine = /[\t ]*\/\/.*/.exec(rest)
        const hasBlock = /[\t ]*\/\*/.exec(rest)
        if (!hasLine && !hasBlock) return

        const haveBoth = hasLine != null && hasBlock != null
        let prior: undefined | 'line' | 'block'
        if (haveBoth) {
          const lineMatched = firstMatched(hasLine)
          const blockMatched = firstMatched(hasBlock)
          prior = lineMatched.start < blockMatched.start ? 'line' : 'block'
        }

        if (hasLine && !hasBlock || haveBoth && prior == 'line') {
          const { start, str } = firstMatched(hasLine)
          if (start == 0) {
            line.isIgnorable = true
            return { blockCommentStartIndex: i }
          } else {
            hasContent = true
            line.content = line.content.slice(0, start)
            line.commentTrailing = str
            break
          }
        }
        if (hasBlock && !hasLine || haveBoth && prior == 'block') {
          const start = firstMatched(hasBlock)
          hasBlockComment = true
          if (start.start != 0) hasContent = true

          const after = rest.slice(start.end)
          const hasBlockEnd = /\*\//.exec(after)
          if (hasBlockEnd) {
            const end = firstMatched(hasBlockEnd)
            rest = rest.slice(start.end + end.end)
          } else {
            line.isIgnorable = true
            return { blockCommentStartIndex: i }
          }
        }
      }

      if (hasBlockComment && !hasContent) line.isIgnorable = true
    },
  ])

  const insertClosingBrackets = (p: number, delta: number) => {
    const prevLine = sxss.lines[p]

    for (let j = 0; j < delta; j++) {
      const level = prevLine.indentLevel - j - 1

      sxss.lines.splice(p + 1 + j, 0, {
        rawExists: false,
        isIgnorable: false,
        raw: '',
        rawIndentSpace: 0,
        indentLevel: level,
        lineNo: prevLine.lineNo,
        content: '}',
        contentLineNo: prevLine.lineNo + j + 1,
      })
    }
  }

  interface ProcessVarsSyntax {
    lineNoOffset: number
    isBlockComment: boolean
  }

  interface ProcessLineVarsSyntax {
    isStatement: boolean
  }

  sxss.process<ProcessVarsSyntax, ProcessLineVarsSyntax>({
    lineNoOffset: 0,
    isBlockComment: false,
  }, {
    isStatement: true,
  }, [
    // Bypass ignorable lines.
    (line, { lineNoOffset }) => {
      if (line.isIgnorable) {
        line.contentLineNo = line.lineNo + lineNoOffset
        return { continue: true }
      }
    },
    // Process multi-lined selectors separated by comma.
    (line) => {
      if (line.raw.endsWith(',')) {
        return { isStatement: false }
      }
    },
    // Process indent.
    (line, { i }) => {
      const n = sxss.findNextIndex(i, (n) => !sxss.lines[n].isIgnorable)
      if (!n) return

      const nextLine = sxss.lines[n]

      if (line.indentLevel < nextLine.indentLevel) {
        line.content = `${line.content} {`
        return { isStatement: false }
      }
    },
    // Process dedent.
    (line, { i, lineNoOffset }) => {
      const p = sxss.findPrevIndex(i, (p) => !sxss.lines[p].isIgnorable)
      if (!p) return

      const prevLine = sxss.lines[p]

      if (line.indentLevel < prevLine.indentLevel) {
        const delta = prevLine.indentLevel - line.indentLevel
        insertClosingBrackets(p, delta)

        return {
          isStatement: false,
          i: i += delta,
          lineNoOffset: lineNoOffset += delta,
        }
      }
    },
    // Insert semicolon.
    (line, { isStatement }) => {
      if (isStatement) {
        line.content = `${line.content};`
      }
    },
    // Adjust line number.
    (line, { lineNoOffset }) => {
      line.contentLineNo += lineNoOffset
    },
  ], [
    // Dedent to level 0 if the last line is not level 0.
    () => {
      const l = sxss.findPrevIndex(sxss.lines.length - 1)
      if (!l) return

      const lastLine = sxss.lines[l]
      insertClosingBrackets(l, lastLine.indentLevel)
    },
  ])

  return sxss.join((indented, line) => {
    if (line.isIgnorable) {
      return line.raw
    } else {
      return `${indented}${line.commentTrailing ?? ''}`
    }
  })
}

const modified = insertSb(`
.a
  /* comment 1 */
  color: red /* // */
  color: blue // /*
`)

console.log(modified)
