# insert-sb-to-sass

Help insert semicolons and brackets to Sass to make its transition to SCSS easier.

> WIP and not really usable.

## Limitations

- It's a string / line based method. Sass is not parsed into some AST.
- It assumes that the input Sass is not ill-formatted (i.e., the indentations are aligned nicely)
- It doesn't work with block comments for now.
- Overall, it's not a syntactic Sass to SCSS converter. It's to help you (and myself) to do less work.

## Todo

- [ ] Work with block comments
- [ ] Convert Sass mixin shorthand to full at-rule
- [ ] A simple website that can do the insertion in the browser
- [ ] A CLI? (not very have the time...)
