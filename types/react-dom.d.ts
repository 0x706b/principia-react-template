import type { ReactNode } from 'react'

type Options = {
  identifierPrefix?: string
  namespaceURI?: string
  progressiveChunkSize?: number
  onCompleteShell?: () => void
  onCompleteAll?: () => void
  onError?: (error: unknown) => void
}

type Controls = {
  /**
   * Cancel any pending I/O and put anything remaining into
   * client rendered mode.
   */
  abort(): void
  pipe<T extends NodeJS.WritableStream>(destination: T): T
}

declare module 'react-dom/server' {
  export function renderToPipeableStream(
    children: ReactNode,
    options?: Options,
  ): Controls
}
