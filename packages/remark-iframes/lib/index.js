import syntax from 'micromark-extension-iframes'
import { safe } from 'mdast-util-to-markdown/lib/util/safe.js'

const DEFAULT_CHARS = {
  exclamationMark: '!',
  openingChar: '(',
  closingChar: ')'
}

function fromMarkdown (handlers) {
  function enterIframeLink (token) {
    this.enter({
      type: 'iframe',
      src: '',
      data: {
        hName: 'iframe',
        hProperties: {
          src: ''
        }
      },
      children: []
    }, token)

    this.buffer()
  }

  function exitIframeLink (token) {
    const context = this.stack[this.stack.length - 2]
    const src = this.resume()

    // This src is used for compiling to Markdown
    context.src = src
    context.data.hProperties = { src }

    this.exit(token)
  }

  return {
    enter: {
      iframeLink: enterIframeLink
    },
    exit: {
      iframeLink: exitIframeLink
    }
  }
}

function toMarkdown (chars) {
  handleIframe.peek = peekIframe

  function handleIframe (node, _, context) {
    const exit = context.enter('iframe')
    const link = safe(context, node.src, {
      before: chars.openingChar,
      after: chars.closingChar
    })
    exit()

    return chars.exclamationMark + chars.openingChar + link + chars.closingChar
  }

  function peekIframe () {
    return chars.exclamationMark
  }

  // Open parenthesis must be escaped
  const after = chars.openingChar === DEFAULT_CHARS.openingChar ? '\\(' : chars.openingChar

  return {
    unsafe: [
      { character: chars.exclamationMark, inConstruct: 'phrasing', after },
      { character: chars.openingChar, inConstruct: 'phrasing', before: chars.exclamationMark },
      { character: chars.closingChar, inConstruct: 'phrasing' }
    ],
    handlers: { iframe: handleIframe }
  }
}

export default function iframePlugin (options = {}) {
  const data = this.data()
  const chars = options.chars || {}
  const charCodes = {}
  const handlers = options.handlers || {}

  // Default chars when not provided
  for (const [key, defaultChar] of Object.entries(DEFAULT_CHARS)) {
    if (typeof chars[key] !== 'string') {
      chars[key] = defaultChar
    }

    charCodes[key] = chars[key].charCodeAt(0)
  }

  function add (field, value) {
    if (data[field]) data[field].push(value)
    else data[field] = [value]
  }

  // Inject handlers
  add('micromarkExtensions', syntax())
  add('fromMarkdownExtensions', fromMarkdown(handlers))
  add('toMarkdownExtensions', toMarkdown(chars))
}
