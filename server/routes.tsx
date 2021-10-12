import type { StaticRouterContext } from 'react-router'

import * as e from '@principia/express'
import React from 'react'
import { renderToPipeableStream } from 'react-dom/server'
import { StaticRouter } from 'react-router'
import stream from 'stream'
import { ServerStyleSheet } from 'styled-components'

import { App } from '../src/App'
import { htmlStart } from './html'
import { ManifestService } from './manifest'

export const SSR = e.get('*', (req, res) =>
  IO.gen(function* (_) {
    const { match } = yield* _(ManifestService)
    yield* _(
      match(req.url).match(
        () =>
          IO.succeedLazy(() => {
            res.status(404).send()
          }),
        (entry) =>
          IO.succeedLazy(() => {
            let errored = false

            const sheet = new ServerStyleSheet()
            const context: StaticRouterContext = {}

            const jsx = sheet.collectStyles(
              <StaticRouter location={req.url} context={context}>
                <App url={req.url} manifest={entry} />
              </StaticRouter>,
            )

            const passthrough = new StyleSheetPassthrough(sheet, res)

            const { pipe } = renderToPipeableStream(jsx, {
              onError: (err) => {
                errored = true
                console.error(err)
              },
              onCompleteShell: () => {
                const initialStyles = sheet.getStyleTags()
                // @ts-expect-error
                sheet.instance.clearTag()
                const start    = htmlStart(entry, initialStyles)
                res.statusCode = errored ? 500 : 200
                res.setHeader('content-type', 'text/html')
                res.write(start)
                pipe(passthrough)
              },
            })

            res.on('end', () => {
              sheet.seal()
            })
          }),
      ),
    )
  }),
)

class StyleSheetPassthrough extends stream.Writable {
  constructor(
    private sheet: ServerStyleSheet,
    private _writable: stream.Writable & { flush?: () => void },
  ) {
    super()
  }

  _write(
    chunk: any,
    encoding: BufferEncoding,
    callback: (err?: Error | null) => void,
  ) {
    let styleTags = this.sheet.getStyleTags()
    // @ts-expect-error
    this.sheet.instance.clearTag()
    if (styleTags.isNonEmpty) {
      this._writable.write(styleTags, encoding, (err) => {
        if (err) {
          console.error(err)
          this.end()
        } else {
          this._writable.write(chunk, encoding, callback)
        }
      })
    } else {
      this._writable.write(chunk, encoding, callback)
    }
  }
  flush() {
    if (typeof this._writable.flush === 'function') {
      this._writable.flush()
    }
  }
  _final(cb: (err?: Error | null) => void) {
    this._writable.end(cb)
  }
}

