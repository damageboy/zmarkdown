import syntax from 'micromark-extension-kbd'
import { containerPhrasing } from 'mdast-util-to-markdown/lib/util/container-phrasing.js'

function fromMarkdown () {
  function enterKbdData (token) {
    this.enter({
      type: 'kbd',
      value: null,
      data: {
        hName: 'kbd'
      },
      children: []
    },
    token)
  }

  function exitKbdData (token) {
    this.exit(token)
  }

  return {
    enter: {
      kbdCallString: enterKbdData
    },
    exit: {
      kbdCallString: exitKbdData
    }
  }
}

function toMarkdown (char) {
  handleKbd.peek = peekKbd

  function handleKbd (node, _, context) {
    const exit = context.enter('kbd')
    const value = containerPhrasing(node, context, { before: char, after: char })
    exit()
    return char + char + value + char + char
  }

  function peekKbd () {
    return char
  }

  return {
    unsafe: [{ character: char, inConstruct: 'phrasing' }],
    handlers: { kbd: handleKbd }
  }
}

export default function kbdPlugin (options = {}) {
  // Default char when not provided
  const char = options.char || '|'
  const charCode = char.charCodeAt(0)
  const data = this.data()

  function add (field, value) {
    if (data[field]) data[field].push(value)
    else data[field] = [value]
  }

  // Inject handlers
  add('micromarkExtensions', syntax({ charCode }))
  add('fromMarkdownExtensions', fromMarkdown())
  add('toMarkdownExtensions', toMarkdown(char))
}
