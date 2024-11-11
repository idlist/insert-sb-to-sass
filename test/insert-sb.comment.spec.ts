import { describe, it, assert } from 'vitest'
import { insertSb } from '@src/index'

describe('Comments', () => {
  it('line comment', () => {
    assert.equal(insertSb(`
.a
  // comment
  color: red`), `
.a {
  // comment
  color: red;
}`)
  })

  it('multi-line line comment', () => {
    assert.equal(insertSb(`
.a
  // comment 1
     comment 2
  color: red`), `
.a {
  // comment 1
  // comment 2
  color: red;
}`)
  })

  it('multi-line line comment only', () => {
    assert.equal(insertSb(`
// comment 1
   comment 2`), `
// comment 1
// comment 2`)
  })

  it('multi-line line comment having indent inside comment 1', () => {
    assert.equal(insertSb(`
.a
  // comment 1
          2
        3
      4
  color: red`), `
.a {
  // comment 1
  //      2
  //    3
  //  4
  color: red;
}`)
  })

  it('multi-line multi-indent having indent inside comment 2', () => {
    assert.equal(insertSb(`
.a
  // comment 1
      2
        3
          4
  color: red`), `
.a {
  // comment 1
  //  2
  //    3
  //      4
  color: red;
}`)
  })

  it('trailing line comment', () => {
    assert.equal(insertSb(`
.a
  color: red // comment`), `
.a {
  color: red; // comment
}`)
  })

  it('block comment', () => {
    assert.equal(insertSb(`
.a
  /* comment
  color: red`), `
.a {
  /* comment */
  color: red;
}`)
  })

  it('multi-line block comment', () => {
    assert.equal(insertSb(`
.a
  /* comment 1
     comment 2
  color: red`), `
.a {
  /* comment 1
     comment 2 */
  color: red;
}`)
  })

  it('inline block comment', () => {
    assert.equal(insertSb(`
.a
  color: /* comment */ red`), `
.a {
  color: /* comment */ red;
}`)
  })

  it('mixed line and block comment', () => {
    assert.equal(insertSb(`
.a
  /* comment 1 */ // comment 2
  color: /* comment 3 */ red // comment 4`), `
.a {
  /* comment 1 */ // comment 2
  color: /* comment 3 */ red; // comment 4
}`)
  })

  it('mixed line and multi-line block comment', () => {
    assert.equal(insertSb(`
.a
  /* comment 1
   */ // comment 2
  color: red`), `
.a {
  /* comment 1
   */ // comment 2
  color: red;
}`)
  })

  it('priority', () => {
    assert.equal(insertSb(`
.a
  color: red /* // comment 1 */
  color: blue // /* comment 2 */`), `
.a {
  color: red /* // comment 1 */;
  color: blue; // /* comment 2 */
}`)
  })
})
