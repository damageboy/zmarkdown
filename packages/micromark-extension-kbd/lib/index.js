import { markdownLineEnding } from 'micromark-util-character'
import { splice } from 'micromark-util-chunked'
import { codes } from 'micromark-util-symbol/codes.js'

const shallow = o => Object.assign({}, o)

export default function micromarkKbd (options = {}) {
  // By default, use the Unicode character U+124 (`|`)
  const unicodeChar = options.charCode || 124

  const call = {
    name: 'kbd',
    tokenize: tokenizeFactory(unicodeChar),
    resolveAll: resolveAllKbd
  }

  // Inject a hook called on the given character
  return {
    text: { [unicodeChar]: call }
  }
}

function resolveAllKbd (events, context) {
  for (let i = 0; i < events.length; i++) {
    const kbdCall = events[i]

    // Find a `kbdCallString` end
    if (kbdCall[1].type !== 'kbdCallString' || kbdCall[0] !== 'exit') continue

    const potentialAdjacent = events[i + 1]

    // Merge together adjacents `kbdCallString`
    if (potentialAdjacent[1].type === 'kbdCallString' && potentialAdjacent[0] === 'enter') {
      events[i - 1][1].end = shallow(events[i + 2][1].end)
      events[i + 2][1].start = shallow(events[i - 1][1].start)

      events.splice(i, 2)
      i--

      continue
    }

    // Take care of the special case `|||||` (five consecutive pipes)
    if (events[i + 1][1]._hasExtra) {
      events[i + 1][1].end._bufferIndex--
      events[i + 1][1].end.column--
      events[i + 1][1].end.offset--

      events[i][1].end._bufferIndex++
      events[i][1].end.column++
      events[i][1].end.offset++
    }

    // Once everything has been merged, insert `data`
    const data = {
      type: 'data',
      start: shallow(kbdCall[1].start),
      end: shallow(kbdCall[1].end)
    }

    splice(events, i, 0, [['enter', data, context]])
    splice(events, i + 1, 0, [['exit', data, context]])

    i += 2
  }

  return events
}

function tokenizeFactory (charCode) {
  return tokenizeKbd

  function tokenizeKbd (effects, ok, nok) {
    let token
    let previous

    return start

    // Define a state `start` that consumes the first pipe character
    function start (code) {
      // Discard all characters except for the required one
      if (code !== charCode) return nok(code)

      effects.enter('kbdCall')
      effects.enter('kbdCallDelimiter')
      effects.consume(code)

      return startSequence
    }

    // Define a state `startSequence` that consumes another pipe character
    function startSequence (code) {
      if (code !== charCode) return nok(code)

      effects.consume(code)
      effects.exit('kbdCallDelimiter')

      return startContent
    }

    // Define a state `startContent` to prevent keyboard entries from starting with a space
    function startContent (code) {
      // Space before? Invalid sequence
      if (code === codes.space) return nok(code)

      // Forbid EOL and EOF
      if (code === codes.eof || markdownLineEnding(code)) {
        return nok(code)
      }

      effects.enter('kbdCallString')
      effects.consume(code)

      return content
    }

    // Define a state `content` to parse the inside
    function content (code) {
      // Allow one more pipe inside, but no more
      if (code === charCode) {
        effects.exit('kbdCallString')
        token = effects.enter('kbdCallDelimiter')
        effects.consume(code)

        return potentialEnd
      }

      // Forbid EOL and EOF
      if (code === codes.eof || markdownLineEnding(code)) {
        return nok(code)
      }

      effects.consume(code)
      previous = code

      return content
    }

    // Define a state `potentialEnd` to match the last pipe
    function potentialEnd (code) {
      // Not a pipe? Switch back to content
      if (code !== charCode) {
        token.type = 'kbdCallString'
        return content(code)
      }

      // Space after? Invalid sequence
      if (previous === codes.space) return nok(code)

      effects.consume(code)

      return extraPipe
    }

    // Define a state `extraPipe` to allow an additionnal pipe (for `|||||`)
    function extraPipe (code) {
      const eaten = (code === charCode)

      if (eaten) {
        effects.consume(code)
        token._hasExtra = true
      }

      effects.exit('kbdCallDelimiter')
      effects.exit('kbdCall')

      return eaten ? ok : ok(code)
    }
  }
}
