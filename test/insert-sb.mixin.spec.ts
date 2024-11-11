import { describe, it, assert } from 'vitest'
import { insertSb } from '@src/index'

describe('Mixin & include', () => {
  it('mixin', () => {
    assert.equal(insertSb(`
=a
  color: red`), `
@mixin a {
  color: red;
}`)
  })

  it('include', () => {
    assert.equal(insertSb(`
.a
  +b`), `
.a {
  @include b;
}`)
  })
})
