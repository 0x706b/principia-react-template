import type { StaticRouterContext } from 'react-router'

import * as e from '@principia/express'
import React from 'react'
import { renderToPipeableStream } from 'react-dom/server'
import { StaticRouter } from 'react-router'

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
            const context: StaticRouterContext = {}

            const { pipe } = renderToPipeableStream(
              <StaticRouter location={req.url} context={context}>
                <App url={req.url} manifest={entry} />
              </StaticRouter>,
              {
                onError: (err) => {
                  errored = true
                  console.error(err)
                },
              },
            )
            const start    = htmlStart(entry)
            res.statusCode = errored ? 500 : 200
            res.setHeader('content-type', 'text/html')
            res.write(start)
            pipe(res)
          }),
      ),
    )
  }),
)
