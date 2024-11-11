# insert-sb-to-sass

Help insert semicolons and brackets to Sass to make its transition to SCSS easier.

## Why?

I really liked Sass for it being concise and having dense information. However, there are some pain points that I cannot ignore over times:

- Sass have somewhat less tooling support (especially when it comes to other libraries or frameworks that *supports* Sass but didn't do very well in their toolings);
- Sometimes CSS is enough, but switching between Sass and CSS is a bit of hassle.
- Sometimes CSS can get very long, yet Sass doesn't have a multi-line syntax.

## Limitations

- It's a string / line based method. Sass is not parsed into some AST.
  - On the other hand, it might be less affected when some new syntax is introduced.
- It assumes that the input Sass is not ill-formatted (i.e., the indentations are aligned nicely)
- Overall, **it's not a syntactic Sass to SCSS converter**.
  - It's supposedly to help you (and mainly myself) to do less work.
  - Using a separate formatter afterwards is still recommended.

## As a module

The main function `insertSb` (and the type for its options `InsertSbOptions`) is provided in npm package `insert-sb-to-sass`.

```ts
function insertSb(content: string, options?: PartialDeep<InsertSbOptions>): string
```

`content`: Sass string.

`options`: Some options:

```ts
export interface InsertSbOptions {
  input: {
    tabSize: number
  },
  output: {
    indentType: 'tab' | 'space'
    indentSize: number
    endOfLine: string
  }
}
```

- `input.tabSize`: How many spaces a tab equals. Needed when the indentations are a mix of spaces and tabs (though who would code in this way?). Defaults to `2`.
- `output.indentType`: Use `tab` or `space` for the indentation. Defaults to `space`.
- `output.indentSize`: Number of spaces of one indentation level. Defaults to `2`.
- `output.endOfLine`: End of the line. Defaults to `\n` (LF).

## Todo

- [x] Convert Sass mixin shorthand to full at-rule
- [x] A simple website that can do the insertion in the browser
- [ ] A CLI...? (don't very have the time...)
- [ ] The inversion...? (using internal editor replacement to delete all `{};` works for most of times)

## License

MIT © i'DLisT 2024
