import dedent from 'dedent'
import {unified} from 'unified'
import reParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import iframesPlugin from '../lib/index'
import remark2rehype from 'remark-rehype'
import remarkStringify from 'remark-stringify'
import rehypeStringify from 'rehype-stringify'

const render = async (text, config) => unified()
  .use(reParse)
  .use(remarkGfm)
  .use(iframesPlugin, config)
  .use(remark2rehype)
  .use(rehypeStringify)
  .process(text)

const renderMarkdown = async (text, config) => unified()
  .use(reParse)
  .use(remarkStringify)
  .use(iframesPlugin, config)
  .process(text)

const config = {
  video: {
    'www.dailymotion.com': {
      tag: 'iframe',
      width: 480,
      height: 270,
      disabled: false,
      replace: [
        ['video/', 'embed/video/'],
      ],
    },
    'www.vimeo.com': {
      tag: 'iframe',
      width: 500,
      height: 281,
      disabled: false,
      replace: [
        ['http://', 'https://'],
        ['www.', ''],
        ['vimeo.com/', 'player.vimeo.com/video/'],
      ],
    },
    'vimeo.com': {
      tag: 'iframe',
      width: 500,
      height: 281,
      disabled: false,
      replace: [
        ['http://', 'https://'],
        ['www.', ''],
        ['vimeo.com/', 'player.vimeo.com/video/'],
      ],
    },
    'www.youtube.com': {
      width: 560,
      height: 315,
      disabled: false,
      oembed: 'https://www.youtube.com/oembed',
    },
    'youtube.com': {
      width: 560,
      height: 315,
      disabled: false,
      oembed: 'https://www.youtube.com/oembed',
    },
    'youtu.be': {
      width: 560,
      height: 315,
      disabled: false,
      oembed: 'https://www.youtube.com/oembed',
    },
    'screen.yahoo.com': {
      tag: 'iframe',
      width: 624,
      height: 351,
      disabled: false,
      append: '?format=embed&player_autoplay=false',
    },
    'www.ina.fr': {
      tag: 'iframe',
      width: 620,
      height: 349,
      disabled: false,
      replace: [
        ['www.', 'player.'],
        ['/video/', '/player/embed/'],
      ],
      append: '/1/1b0bd203fbcd702f9bc9b10ac3d0fc21/560/315/1/148db8',
      removeFileName: true,
    },
    'www.jsfiddle.net': {
      tag: 'iframe',
      width: 560,
      height: 560,
      disabled: false,
      replace: [
        ['http://', 'https://'],
      ],
      append: 'embedded/result,js,html,css/',
      match: /https?:\/\/(www\.)?jsfiddle\.net\/([\w\d]+\/[\w\d]+\/\d+\/?|[\w\d]+\/\d+\/?|[\w\d]+\/?)$/,
    },
    'jsfiddle.net': {
      tag: 'iframe',
      width: 560,
      height: 560,
      disabled: false,
      replace: [
        ['http://', 'https://'],
      ],
      append: 'embedded/result,js,html,css/',
      match: /https?:\/\/(www\.)?jsfiddle\.net\/([\w\d]+\/[\w\d]+\/\d+\/?|[\w\d]+\/\d+\/?|[\w\d]+\/?)$/,
    },
  },
  extra: {
    'www.youtube.com': {
      tag: 'iframe',
      width: 560,
      height: 315,
      disabled: false,
      replace: [
        ['watch?v=', 'embed/'],
        ['http://', 'https://'],
      ],
      droppedQueryParameters: ['feature'],
      removeAfter: '&',
    },
    'jsfiddle.net': {
      tag: 'iframe',
      width: 560,
      height: 560,
      disabled: true,
      replace: [
        ['http://', 'https://'],
      ],
      append: 'embedded/result,js,html,css/',
    },
  },
  toMd: {
    'www.youtube.com': {
      tag: 'iframe',
      width: 560,
      height: 315,
      disabled: false,
      replace: [
        ['watch?v=', 'embed/'],
        ['http://', 'https://'],
      ],
      removeAfter: '&',
    },
    'jsfiddle.net': {
      tag: 'iframe',
      width: 560,
      height: 560,
      disabled: true,
      replace: [
        ['http://', 'https://'],
      ],
      append: 'embedded/result,js,html,css/',
      match: /https?:\/\/(www\.)?jsfiddle\.net\/([\w\d]+\/[\w\d]+\/\d+\/?|[\w\d]+\/\d+\/?|[\w\d]+\/?)$/,
      thumbnail: {
        format: 'http://www.unixstickers.com/image/data/stickers' +
        '/jsfiddle/JSfiddle-blue-w-type.sh.png',
      },
    },
  },
}

test('video', async () => {
  const {value} = await render(dedent`
    !(https://www.youtube.com/watch?v=FdltlrKFr1w)

    !(https://www.dailymotion.com/video/x2y6lhm)

    !(http://vimeo.com/133693532)

    !(https://screen.yahoo.com/weatherman-gives-forecast-using-taylor-191821481.html)

    A [link with **bold**](http://example.com)

    !(https://youtu.be/FdltlrKFr1w)

    !(http://youtube.com/watch?v=FdltlrKFr1w)

    !(http://jsfiddle.net/Sandhose/BcKhe/1/)

    !(http://jsfiddle.net/zgjhjv9j/)

    !(http://jsfiddle.net/zgjhjv9j/1/)

    !(https://www.youtube.com/watch?v=1Bh4DZ2xGmw&ab_channel=DestinationPr%C3%A9pa)

    !(http://www.ina.fr/video/MAN9062216517/)

    Not parsed:

    !(http://jsfiddle.net/Sandhose/BcKhe/)

    !(https://www.youtube.com/watch?v=FdltlrKFr1w)
    with text after
  `, {providers: config.video})

  expect(value).toMatchSnapshot()
})

test('oembed falls back', async () => {
  const providers = {
    'www.youtube.com': {
      width: 560,
      height: 315,
      disabled: false,
      oembed: 'http://example.com:7777/oembed',
    },
  }
  const result = await render(dedent`
    !(https://www.youtube.com/watch?v=FdltlrKFr1w)
  `, {providers})

  expect(result.messages[0].message).toContain('timeout')
  expect(result.value).toMatchSnapshot()
})

test('extra', async () => {
  const {value: parsed} = await render(dedent`
    !(https://www.youtube.com/watch?v=FdltlrKFr1w)

    !(https://www.youtube.com/watch?feature=embedded&v=FdltlrKFr1w)
  `, {providers: config.extra})
  expect(parsed).toMatch(/iframe.*iframe/)

  const {value: notParsed} = await render(dedent`
    !(http://jsfiddle.net/Sandhose/BcKhe/1/)

    !(http://jsfiddle.net/zgjhjv9j/)

    !(http://jsfiddle.net/zgjhjv9j/1/)

    !(http://jsfiddle.net/Sandhose/BcKhe/)
  `, {providers: config.extra})
  expect(notParsed).not.toMatch('iframe')
})

test('does not parse without markers', async () => {
  const providers = {
    'www.youtube.com': {
      tag: 'iframe',
      width: 560,
      height: 315,
      disabled: false,
      replace: [
        ['watch?v=', 'embed/'],
        ['http://', 'https://'],
      ],
      droppedQueryParameters: ['feature'],
      removeAfter: '&',
    },
  }

  const {value} = await render(dedent`
    !(https://www.youtube.com/watch?v=FdltlrKFr1w)

    https://www.youtube.com/watch?v=FdltlrKFr1w
  `, {providers})

  expect(value).toMatchSnapshot()
})

test('Errors without config', async () => {
  expect(render('')).rejects.toThrowError(Error)
})

test('Errors with empty config', async () => {
  expect(render('', {})).rejects.toThrowError(Error)
})


test('Errors with invalid config', async () => {
  expect(render('', '')).rejects.toThrowError(Error)
})

test('Compiles to Markdown', async () => {
  const txt = dedent`
    A [link with **bold**](http://example.com)

    !(https://www.youtube.com/watch?v=FdltlrKFr1w)

    These ones should not be allowed by config:

    !(http://jsfiddle.net/Sandhose/BcKhe/1/)

    !(http://jsfiddle.net/zgjhjv9j/)

    !(http://jsfiddle.net/zgjhjv9j/1/)

    !(http://jsfiddle.net/Sandhose/BcKhe/)

    Foo !(this is a parenthesis) bar
  `
  const {value} = await renderMarkdown(txt, {providers: config.toMd})
  expect(value).toMatchSnapshot()

  config.toMd['jsfiddle.net'].disabled = false
  const withJsFiddleActivated = await renderMarkdown(txt, {providers: config.toMd})
  expect(withJsFiddleActivated.value).toMatchSnapshot()
})
