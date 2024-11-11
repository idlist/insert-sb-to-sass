import { PartialDeep } from 'type-fest'
import Sxss, { type SxssConfig } from './sxss'
import { firstMatched } from './utils'

export interface InsertSbOptions extends SxssConfig {
}

declare module './sxss' {
  interface Line {
    commentTrailing?: string
  }
}

export const insertSb = (content: string, options?: PartialDeep<InsertSbOptions>) => {
  const config: InsertSbOptions = {
    input: {
      tabSize: 2,
      ...options?.input,
    },
    output: {
      indentType: 'space',
      indentSize: 2,
      endOfLine: '\n',
      ...options?.output,
    },
  }

  const sxss = new Sxss(config)
  sxss.parse(content)

  interface ProcessVarsComment {
    multiLineCommentType?: 'line' | 'block'
    multiLineCommentStartIndex?: number
    indentLevelOffset: number
  }

  interface ProcessLineVarsComment {
  }

  sxss.process<ProcessVarsComment, ProcessLineVarsComment>({
    indentLevelOffset: 0,
  }, {}, [
    // Process indented comments.
    (line, { i, multiLineCommentType, multiLineCommentStartIndex, indentLevelOffset }) => {
      if (typeof multiLineCommentStartIndex == 'undefined') return
      const startLine = sxss.lines[multiLineCommentStartIndex]

      if (line.rawIndentSpace > startLine.rawIndentSpace) {
        line.indentLevel = startLine.indentLevel + 1
        line.isIgnorable = true
        line.content = line.raw
        if (multiLineCommentType == 'line') {
          const j = startLine.rawIndentSpace
          line.content = line.content.slice(0, j) + '//' + line.raw.slice(j + 2)
        }
        return { continue: true }
      } else {
        const delta = startLine.indentLevel - line.indentLevel
        if (multiLineCommentType == 'block' && !sxss.lines[i - 1].content.includes('*/')) {
          sxss.lines[i - 1].content += ' */'
        }
        return {
          multiLineCommentType: undefined,
          multiLineCommentStartIndex: undefined,
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
      let offset = 0
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
            line.content = line.raw
            line.isIgnorable = true
            return {
              multiLineCommentType: 'line',
              multiLineCommentStartIndex: i,
            }
          } else {
            hasContent = true
            line.content = line.content.slice(0, start + offset)
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
            offset += start.end + end.end
          } else {
            line.content = line.raw
            line.isIgnorable = true
            return {
              multiLineCommentType: 'block',
              multiLineCommentStartIndex: i,
            }
          }
        }
      }

      if (hasBlockComment && !hasContent) line.isIgnorable = true
    },
  ])

  const insertClosingBrackets = (p: number, delta: number, offset: number) => {
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
        contentLineNo: prevLine.lineNo + j + offset + 1,
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
      if (line.content.endsWith(',')) {
        return { isStatement: false }
      }
    },
    // Process indented @mixin and @include.
    (line) => {
      line.content = line.content.replace(/^\=/, '@mixin ')
      line.content = line.content.replace(/^\+/, '@include ')
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
        insertClosingBrackets(p, delta, lineNoOffset)

        return {
          i: i += delta,
          lineNoOffset: lineNoOffset + delta,
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
    ({ lineNoOffset }) => {
      const l = sxss.findPrevIndex(sxss.lines.length, (p) => !sxss.lines[p].isIgnorable)
      if (!l) return

      const lastLine = sxss.lines[l]
      insertClosingBrackets(l, lastLine.indentLevel, lineNoOffset)
    },
  ])

  // console.log(sxss.lines)

  return sxss.join((indented, line) => {
    const trailing = line.commentTrailing ?? ''
    if (line.isIgnorable) {
      return `${line.content}${trailing}`
    } else {
      return `${indented}${trailing}`
    }
  })
}
