import {} from '@principia/base/fluent'
import React from 'react'
import { Route, Switch } from 'react-router'

const Home  = React.lazy(() => import('../pages/Home'))
const About = React.lazy(() => import('../pages/About'))

interface AppProps {
  readonly url?: string
  readonly manifest?: ReadonlyArray<{ href: string }>
}

export const App: React.FC<AppProps> = () => (
  <React.Suspense fallback={<p>Loading...</p>}>
    <Switch>
      <Route exact path="/" component={Home} />
      <Route path="/about" component={About} />
    </Switch>
  </React.Suspense>
)
