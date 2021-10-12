import 'isomorphic-fetch'

import { Console } from '@principia/base/IO/Console'
import * as e from '@principia/express'
import { runMain } from '@principia/node/Runtime'
import compression from 'compression'
import express from 'express'
import path from 'path'

import {} from './imports'
import { makeManifestService } from './manifest'
import * as Routes from './routes'

const Manifest = makeManifestService('./dist/public/route-manifest.json')

const staticMiddleware = e.use(
  e.classic(express.static(path.join(__dirname, 'public'))),
)

const compressionMiddleware = e.use(e.classic(compression()))

const Express = e.LiveExpressApp['<+<'](
  e.LiveExpressAppConfig('0.0.0.0', 8080, e.defaultExitHandler),
)

const program = IO.gen(function* (_) {
  yield* _(compressionMiddleware)
  yield* _(staticMiddleware)
  yield* _(Routes.SSR)
  const { server } = yield* _(e.ExpressApp)
  yield* _(Console.put('🚀 Express started on', server.address()))
  yield* _(IO.never)
})

runMain(program.give(Manifest['+++'](Express)))
