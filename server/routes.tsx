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

            const passthrough = new stream.PassThrough()

            const { pipe } = renderToPipeableStream(jsx, {
              onError: (err) => {
                errored = true
                console.error(err)
              },
              onCompleteShell: () => {
                const styles   = sheet.getStyleTags()
                const start    = htmlStart(entry, styles)
                res.statusCode = errored ? 500 : 200
                res.setHeader('content-type', 'text/html')
                res.write(start)
                pipe(passthrough)
                if (!styles.includes('style')) {
                  sheet.interleaveWithNodeStream(passthrough).pipe(res)
                } else {
                  passthrough.pipe(res)
                }
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
