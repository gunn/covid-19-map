import * as React from 'react'
import KeplerGl from 'kepler.gl'

import { createStore, combineReducers, applyMiddleware } from 'redux'
import { taskMiddleware } from 'react-palm/tasks'
import { Provider, useDispatch } from 'react-redux'

import keplerGlReducer from 'kepler.gl/reducers'
import { addDataToMap } from 'kepler.gl/actions'


const reducers = combineReducers({
  keplerGl: keplerGlReducer
})

const store = createStore(reducers, {}, applyMiddleware(taskMiddleware))


type MapProps = {
  data: any
}
export default (props: MapProps)=> (
  <Provider store={store}>
    <Map {...props} />
  </Provider>
)


const Map = React.memo(({data}: MapProps)=> {
  const dispatch = useDispatch()
  const [_, forceUpdate] = React.useState(0)

  React.useEffect(()=> {
    window.addEventListener("resize", ()=> forceUpdate(Math.random()))
  }, [])

  React.useEffect(() => {
    if (data) {
      dispatch(
        addDataToMap({
          datasets: {
            info: {
              label: "COVID data",
              id: "covid-data"
            },
            data
          },
          option: {
            centerMap: true,
            readOnly: false
          },
          config: {}
        })
      );
    }
  }, [dispatch, data])

  return (
    <KeplerGl
      id="covid"
      mapboxApiAccessToken={window["MAPBOX_API_KEY"]}
      width={window.innerWidth}
      height={window.innerHeight}
    />
  )
})
