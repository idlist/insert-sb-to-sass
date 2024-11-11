# insert-sb-to-sass

Help insert semicolons and brackets to Sass to make its transition to SCSS easier.

> WIP and not really usable.

## Why?

I really liked Sass for it being concise and having dense information. However, there are some pain points that I cannot ignore over times:

- Sass have somewhat less tooling support (especially when it comes to other libraries or frameworks that *supports* Sass but didn't do very well in their toolings);
- Sometimes CSS is enough, but switching between Sass and CSS is a bit of hassle.
- Sometimes CSS can get very long, yet Sass doesn't have a multi-line syntax.

## Limitations

- It's a string / line based method. Sass is not parsed into some AST.
  - On the other hand, it might be less affected when some new syntax is introduced.
- It assumes that the input Sass is not ill-formatted (i.e., the indentations are aligned nicely)
- Overall, it's not a syntactic Sass to SCSS converter. It's supposedly to help you (and myself) to do less work.

## Todo

- [x] Convert Sass mixin shorthand to full at-rule
- [ ] A simple website that can do the insertion in the browser
- [ ] A CLI? (don't very have the time...)
- [ ] The inversion? (batch replacing all `{};` to empty string works for most of times, and I doubt if it's necessary)
