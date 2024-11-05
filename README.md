# insert-sb-to-sass

Help insert semicolon and brackets to Sass to make its transition to SCSS easier.

## Limitations

- It's a string / line based method. Sass is not parsed into some AST.
- It assumes that the input Sass is not ill-formatted (i.e., the indents are aligned nicely)
- It doesn't work with block comments for now.

## Todo

- [ ] Work with block comments
- [ ] Convert Sass mixin shorthand to full at-rule
