import type { Response } from 'express'
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

export class StyleSheetPassthrough extends stream.Writable {
  constructor(
    private sheet: ServerStyleSheet,
    private _writable: stream.Writable,
  ) {
    super()
  }

  writeChunk(
    chunk: any,
    encoding: BufferEncoding,
    cb: (err?: Error | null) => void,
  ): void {
    if (!this._writable.write(chunk, encoding)) {
      this._writable.once('drain', cb)
    } else {
      cb()
    }
  }

  _write(
    chunk: any,
    encoding: BufferEncoding,
    cb: (err?: Error | null) => void,
  ): void {
    let needsDrain = false
    // Get the style tags from the `ServerStyleSheet` since the last write
    let styleTags = this.sheet.getStyleTags()
    // Clear the style tags we just got from the `ServerStyleSheet` instance
    // styled-components does not expose `clearTag` on `instance` so...
    // @ts-expect-error
    this.sheet.instance.clearTag()
    // Write the style tags to the response
    if (styleTags.isNonEmpty) {
      needsDrain = !this._writable.write(styleTags, 'utf8')
    }
    // If the destination needs draining after writing the style tags,
    // wait for it to drain, then write the chunk from React. Otherwise,
    // just write the chunk.
    if (needsDrain) {
      this._writable.once('drain', () => {
        this.writeChunk(chunk, encoding, cb)
      })
    } else {
      this.writeChunk(chunk, encoding, cb)
    }
  }

  _final(): void {
    this._writable.end()
  }
}
