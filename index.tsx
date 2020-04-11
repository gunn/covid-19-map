import * as React from 'react'
import * as ReactDOM from 'react-dom'
import App from './src/App'

declare const module
module?.hot?.accept()

ReactDOM.render(
  <App />,
  document.getElementById('root')
)
