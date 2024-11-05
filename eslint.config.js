import js from '@eslint/js'
import ts from 'typescript-eslint'
import vue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'
import globals from 'globals'

export default ts.config(
  {
    ignores: [],
  },
  {
    files: ['**/*.vue'],
    extends: [
      ...vue.configs['flat/recommended'],
      ...ts.configs.recommended,
    ],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: ts.parser,
      },
    },
    rules: {
      'vue/html-closing-bracket-newline': ['off'],
      'vue/first-attribute-linebreak': ['off'],
      'vue/html-indent': ['warn', 2, {
        alignAttributesVertically: false,
      }],

      'vue/max-attributes-per-line': ['warn', {
        singleline: { max: Number.POSITIVE_INFINITY },
        multiline: { max: 1 },
      }],
      'vue/html-self-closing': ['warn', {
        'html': { 'normal': 'never', 'void': 'always' },
      }],
      'vue/component-name-in-template-casing': ['warn', 'PascalCase' ],
    },
  },
  {
    files: ['**/*.ts'],
    extends: [
      ...ts.configs.recommended,
    ],
  },
  {
    files: ['**/*.ts', '**/*.vue'],
    rules: {
      '@typescript-eslint/no-empty': 'off',
      '@typescript-eslint/no-empty-interface': 'off',

      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'prefer-const': 'warn',
    },
  },
  {
    files: ['*.js', '**/*.js'],
    ...js.configs.recommended,
    rules: {
      'no-empty': 'off',

      'no-empty-function': 'warn',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'prefer-const': 'warn',
    },
  },
  {
    languageOptions: {
      globals: {
        ...globals.es2024,
        ...globals.browser,
      },
    },
    rules: {
      indent: ['warn', 2, { SwitchCase: 1 }],
      semi: ['warn', 'never'],
      quotes: ['warn', 'single'],
      'comma-dangle': ['warn', 'always-multiline'],
      'arrow-parens': ['warn', 'always'],
      'eol-last': ['warn', 'always'],
    },
  },
)
