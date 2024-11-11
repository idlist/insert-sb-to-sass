import { describe, it, assert } from 'vitest'
import { insertSb } from '@src/index'

describe('Indent & dedent', () => {
  it('indent', () => {
    assert.equal(insertSb(`
.a
  color: red`), `
.a {
  color: red;
}`)
  })

  it('nested indent', () => {
    assert.equal(insertSb(`
.a
  .b
    color: red`), `
.a {
  .b {
    color: red;
  }
}`)
  })

  it('compound case', () => {
    assert.equal(insertSb(`
.a
  color: red
  .b
    color: blue
.c
  color: green`), `
.a {
  color: red;
  .b {
    color: blue;
  }
}
.c {
  color: green;
}`)
  })
})
