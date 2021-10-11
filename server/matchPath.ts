import type { Match, Path } from 'node-match-path'

import { match } from 'node-match-path'

export type Matcher = (url: string) => Match

export const makePathMatcher: (path: Path) => Matcher =
  (path) => (url: string) =>
    match(path, url)

export const matchPaths =
  (matchers: ReadonlyArray<Matcher>) =>
  (url: string): Maybe<{ match: Match, index: number }> =>
    matchers.findMap((matcher, index) => {
      const match = matcher(url)
      return match.matches ? Maybe.Just({ match, index }) : Maybe.Nothing()
    })
