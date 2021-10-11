import type { ManifestEntry } from './manifest'

export const htmlStart = (
  manifest: ReadonlyArray<ManifestEntry>,
  styleTags: string,
) => `
<!DOCTYPE html>
<html>
  <head>
    <title>principia-react-template</title>
    <meta charset="UTF-8" />
    <link rel="stylesheet" href="/assets/style.css" />
    <script type="module" src="/js/main.js" async></script>
    ${manifest
      .map((m) => `<link rel="modulepreload" href="${m.href}" />`)
      .reverse()
      .join('')}
    ${styleTags}
  </head>

  <body>
    <div id="app">`

export const htmlEnd = `</div>
  </body>
</html>
`
