import type { PathLike } from 'fs'

import { tag } from '@principia/base/Has'
import { tuple } from '@principia/base/tuple'
import * as fs from '@principia/node/fs'

import { makePathMatcher, matchPaths } from './matchPath'

export class ManifestEntry extends Schema.Model<ManifestEntry>()(
  Schema.properties({
    type: Schema.string.prop(),
    href: Schema.string.prop(),
  }),
) {}

export class Manifest extends Schema.Model<Manifest>()(
  ManifestEntry.array().record(),
) {}

export class ManifestError extends Error {
  readonly _tag = 'ManifestError'
  constructor(readonly error: unknown) {
    super()
  }
}

export interface ManifestService {
  readonly match: (url: string) => Maybe<ReadonlyArray<ManifestEntry>>
}

export const ManifestService = tag<ManifestService>()

export const makeManifestService = (path: PathLike) =>
  IO.gen(function* (_) {
    const manifest = yield* _(
      fs
        .readFile(path)
        .mapError((err) => new ManifestError(err))
        .chain((buffer) =>
          IO.tryCatch<ManifestError, unknown>(
            () => JSON.parse(buffer.toString('utf8')),
            (err) => new ManifestError(err),
          ),
        )
        .chain((json) =>
          Manifest.decode(json).match(
            (err) => IO.fail(new ManifestError(err)),
            IO.succeed,
            (_, manifest) => IO.succeed(manifest),
          ),
        ).orHalt,
    )
    const paths   = Object.keys(manifest).map((p) => tuple(p, makePathMatcher(p)))
    const matcher = matchPaths(paths.map(([, matcher]) => matcher))

    function match(url: string): Maybe<ReadonlyArray<ManifestEntry>> {
      return matcher(url).map(({ index }) => manifest[paths[index][0]])
    }

    return {
      match,
    }
  }).toLayer(ManifestService)
