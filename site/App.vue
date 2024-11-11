<script setup lang="ts">
import { ref, computed, watch, useTemplateRef } from 'vue'
import { debounce } from 'radash'
import { insertSb, type InsertSbOptions } from '@src/index'

const inputContent = ref('')
const inputEditor = useTemplateRef('inputEditor')
const outputContent = ref('')

const inputInsertTab = ref(false)
const inputTabSize = ref(2)
const outputIndentType = ref<'space' | 'tab'>('space')
const outputIndentSize = ref(2)
const outputEndOfLine = ref<'LF' | 'CRLF'>('LF')

const options = computed<InsertSbOptions>(() => {
  return {
    input: {
      tabSize: inputTabSize.value,
    },
    output: {
      indentType: outputIndentType.value,
      indentSize: outputIndentSize.value,
      endOfLine: outputEndOfLine.value == 'LF' ? '\n' : '\r\n',
    },
  }
})

watch([inputContent, options], debounce({ delay: 100 }, ([content, options]) => {
  outputContent.value = insertSb(content, options)
}))

const naiveKeydown = (e: KeyboardEvent) => {
  if (!inputEditor.value) return

  if (e.key == 'Tab') {
    e.preventDefault()
    const cursor = inputEditor.value.selectionStart
    const input = inputContent.value
    const inserted = inputInsertTab.value ? '\t' : ' '.repeat(inputTabSize.value)
    inputContent.value = input.slice(0, cursor) + inserted + input.slice(cursor)
  }
}

const copyOutput = () => {
  navigator.clipboard.writeText(outputContent.value)
}

const placeholder = `@use "sass:list"
@use "sass:color"

$font-stack: Helvetica, Arial
$primary-color: #333

body
  $font-stack: list.append($font-stack, sans-serif)
  font: $font-stack

a
  color: $primary-color

  &:hover
    color: color.scale($primary-color, $lightness: 20%)

@debug $font-stack
`

const placeholderInserted = computed(() => insertSb(placeholder, options.value))
</script>

<template>
  <nav>
    <div class="nav-content">
      <h1>Insert <code title="semicolons and brackets">{};</code> to Sass!</h1>
      <a class="link-github"
        href="https://github.com/idlist/insert-sb-to-sass"
        target="_blank"
        noopener
        noreferer>GitHub</a>
    </div>
  </nav>

  <div class="page">
    <div class="options">
      <div class="options-title">Options:</div>

      <div class="options-list">
        <div class="options-category">input</div>

        <label>
          Insert tab
          <input v-model="inputInsertTab"
            type="checkbox"
            name="inputInsertTab" />
        </label>

        <label>
          Tab size
          <input v-model.number="inputTabSize"
            type="text"
            name="inputTabSize"
            :disabled="inputInsertTab" />
        </label>
      </div>

      <div class="options-list">
        <div class="options-category">output</div>

        <label>
          Indent type
          <select v-model="outputIndentType" name="outputIndentType">
            <option value="space">Space</option>
            <option value="tab">Tab</option>
          </select>
        </label>

        <label>
          Indent size
          <input v-model.number="outputIndentSize"
            type="text"
            name="outputIndentSize"
            :disabled="outputIndentType != 'space'" />
        </label>

        <label>
          End of line
          <select v-model="outputEndOfLine" name="outputEndOfLine">
            <option value="LF">LF</option>
            <option value="CRLF">CRLF</option>
          </select>
        </label>
      </div>
    </div>

    <div class="editor-area">
      <div class="input">
        <textarea ref="inputEditor"
          v-model="inputContent"
          class="editor"
          name="input area"
          :placeholder="placeholder"
          @keydown="naiveKeydown">
        </textarea>
      </div>

      <div class="output">
        <textarea v-model="outputContent"
          class="editor"
          readonly
          name="output area"
          :placeholder="placeholderInserted">
        </textarea>
        <button
          type="button"
          class="output-copy"
          @click="copyOutput">
          Copy
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
$nav-height: 2.5rem;

nav {
  position: fixed;
  height: $nav-height;
  left: 0;
  right: 0;

  display: flex;
  align-items: center;
  padding: 0 0.5rem;
}

.nav-content {
  display: flex;
  align-items: baseline;
  column-gap: 0.5rem;
}

code {
  font-size: 0.875em;
  background-color: hsla(0, 0%, 0%, 0.1);
  border-radius: 0.25rem;
  padding: 0.125rem;
}

h1 {
  font-size: 1.25rem;
}

.page {
  position: fixed;
  top: $nav-height;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0.25rem;

  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: max-content auto;
}

.options {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem 0.5rem;
  padding: 0.25rem;

  &-title {
    font-weight: bold;
  }

  label {
    display: flex;
    align-items: center;

    select,
    input {
      height: 1.75rem;
      margin-left: 0.25rem;
    }
  }

  input[type=text] {
    width: 4rem;
    text-align: right;
  }

  &-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 0.5rem;
    align-items: center;
  }

  &-category {
    font-size: 0.875rem;
    background-color: hsla(0, 0%, 0%, 0.8);
    color: white;
    padding: 0.25rem 0.375rem;
    border-radius: 0.25rem;
  }
}

.editor-area {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 0.5rem;
  row-gap: 0.5rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr;
  }
}

.editor {
  width: 100%;
  height: 100%;
  resize: none;

  font-family: monospace;
  padding: 0.5rem;

  &::placeholder {
    color: hsla(0, 0%, 0%, 0.25)
  }

  border: 1px solid hsla(0, 0%, 0%, 0.8);
  border-radius: 0.25rem;
}

.output {
  position: relative;
}

.output-copy {
  position: absolute;
  top: 0.5rem;
  right: 1rem;
  padding: 0.5rem;
  background-color: white;
  border: 1px solid black;
  border-radius: 0.25rem;

  &:hover,
  &:active {
    background-color: hsla(0, 0%, 0%, 0.05)
  }
}
</style>
