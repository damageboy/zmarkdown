# remark-iframes

This plugin parses custom Markdown syntax to create iframes.
It adds a new node type to the [mdast][mdast] produced by [remark][remark]: `iframe`.

If you are using [rehype][rehype], the stringified HTML result will be a tag you can configure. Most of time you want `iframe`.

## Syntax

```markdown
!(https://www.youtube.com/watch?v=8TQIvdFl4aU)
```

## AST (see [mdast][mdast] specification)

```javascript
interface iframe <: Node {
  type: "iframe";
  url: string;
  provider: string;
  data: {
    hName: "iframe";
    hProperties: {
      src: string;
      width: 0 <= uint32;
      height: 0 <= uint32;
      allowfullscreen: boolean;
      frameborder: string;
    }
    thumbnail: string?;
  }
}
```

`provider` variable refers to the provider as configured in plugin options.

## Installation

[npm][npm]:

```bash
npm install remark-iframes
```

## Usage

Dependencies:

```javascript
const unified = require('unified')
const remarkParse = require('remark-parse')
const stringify = require('rehype-stringify')
const remark2rehype = require('remark-rehype')
const remarkIframe = require('remark-iframes')
```

Usage:

```javascript
unified()
  .use(remarkParse)
  .use(remarkIframe, {
    providers: [
      {
        hostname: ['youtube.com', 'www.youtube.com', 'youtu.be'],
        width: 560,
        height: 315,
        disabled: false,
        oembed: 'https://www.youtube.com/oembed'
      },
      {
        hostname: ['jsfiddle.net', 'www.jsfiddle.net'],
        width: 560,
        height: 560,
        disabled: false,
        match: /https?:\/\/(www\.)?jsfiddle\.net\/([\w\d]+\/[\w\d]+\/\d+\/?|[\w\d]+\/\d+\/?|[\w\d]+\/?)$/,
        transformer: embedLink => `${embedLink.replace('http://', 'https://')}embedded/result,js,html,css/`
      }
    ]
  })
  .use(remark2rehype)
  .use(stringify)
```

### Configuration

This plugin can take the `providers` option, which contains a list of providers allowed for iframes. Any of the given providers object can have the following fields:

- `hostname`: a hostname or list of hostnames matched.
- `width` and `height`: iframe size, set as `width="" height=""` HTML attributes. If `oembed` is used (see below), these parameters overwrite the oEmbed response.
        disabled: false,
        oembed: 'https://www.youtube.com/oembed'
- `disabled`: can be used to disable this provider. This is useful when you want to deal with multiple configurations from a common set of plugins.
- `oembed`: an URL to the oEmbed API of the website you want to embed. Not intended to be used in conjunction with `transform`.
- `transform`: a way to transform the Markdown URL in order to make the iframe `src` URL. Not intended to be used in conjunction with `oembed`.
- `thumbnail`: a way to retrieve a thumbnail. This param is either a (constant) string or a function that takes the final URL as a parameter. When using oEmbed, this parameter is discarded.

### oEmbed usage

As stated above, when using the `oembed` configuration parameter, the other parameters are discarded, excepted for `disabled`, which can be used freely; you may use `width` and `height` if really needed, altough it is not recommended by the oEmbed specification.

The thumbnail is constructed from the oEmbed `thumbnail_url` response, so there is no need for providing any URL, and any configuration will not be taken into account.

## Example

### Config:

```javascript
{
  providers: [
    {
      hostname: ['youtube.com', 'www.youtube.com', 'youtu.be'],
      width: 560,
      height: 315,
      disabled: false,
      oembed: 'https://www.youtube.com/oembed'
    },
    {
      hostname: ['jsfiddle.net', 'www.jsfiddle.net'],
      width: 560,
      height: 560,
      disabled: false,
      match: /https?:\/\/(www\.)?jsfiddle\.net\/([\w\d]+\/[\w\d]+\/\d+\/?|[\w\d]+\/\d+\/?|[\w\d]+\/?)$/,
      transformer: embedLink => `${embedLink.replace('http://', 'https://')}embedded/result,js,html,css/`
    }
  ]
}
```

### Input:

```markdown
!(https://www.youtube.com/watch?v=8TQIvdFl4aU)
```

### Resulting Node

```javascript
{
    type: 'iframe',
    provider: 'www.youtube.com',
    data: {
        hName: 'iframe',
        hProperties: {
          src: 'https://www.youtube.com/embed/8TQIvdFl4aU?feature=oembed',
          width: 560,
          height: 315,
          allowfullscreen: true,
          frameborder: '0'
        }
        thumbnail: 'https://i.ytimg.com/vi/8TQIvdFl4aU/hqdefault.jpg'
      }
}
```

### Resulting HTML

```html
<iframe src="https://www.youtube.com/embed/8TQIvdFl4aU?feature=oembed" width="560" height="315"></iframe>
```

## License

[MIT][license] © [Zeste de Savoir][zds]

<!-- Definitions -->

[build-badge]: https://img.shields.io/travis/zestedesavoir/zmarkdown.svg

[build-status]: https://travis-ci.org/zestedesavoir/zmarkdown

[coverage-badge]: https://img.shields.io/coveralls/zestedesavoir/zmarkdown.svg

[coverage-status]: https://coveralls.io/github/zestedesavoir/zmarkdown

[license]: https://github.com/zestedesavoir/zmarkdown/blob/master/packages/remark-iframes/LICENSE

[zds]: https://zestedesavoir.com

[npm]: https://www.npmjs.com/package/remark-iframes

[rehype]: https://github.com/rehypejs/rehype
