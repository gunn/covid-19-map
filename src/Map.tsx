import * as React from 'react'
import KeplerGl from 'kepler.gl'

import { createStore, combineReducers, applyMiddleware } from 'redux'
import { taskMiddleware } from 'react-palm/tasks'
import { Provider, useDispatch } from 'react-redux'

import KeplerGlSchema from 'kepler.gl/schemas'
import keplerGlReducer from 'kepler.gl/reducers'
import { addDataToMap, updateMap, toggleSidePanel } from 'kepler.gl/actions'


const reducers = combineReducers({
  keplerGl: keplerGlReducer
})

const store = createStore(reducers, {}, applyMiddleware(taskMiddleware))


type MapProps = {
  endDate: Date
  date: Date
  data: any
  config: any
  configGetter: React.MutableRefObject<Function>
}
export default (props: MapProps)=> (
  <Provider store={store}>
    <Map {...props} />
  </Provider>
)


let firstRun = true
let initialMapToLoad

const Map = React.memo(({data, endDate, date, config, configGetter}: MapProps)=> {
  const dispatch = useDispatch()
  const [_, forceUpdate] = React.useState(0)

  React.useEffect(()=> {
    dispatch(addDataToMap({}))
    dispatch(toggleSidePanel())
    window.addEventListener("resize", ()=> forceUpdate(Math.random()))
  }, [])

  React.useEffect(()=> {
    if (config) {
      initialMapToLoad = KeplerGlSchema.load([], config)

      dispatch(addDataToMap(initialMapToLoad))

      configGetter.current = ()=> (
        KeplerGlSchema.getConfigToSave(store.getState().keplerGl["covid"])
      )
    }
  }, [config])

  React.useEffect(() => {
    if (config && data?.rows.length) {
      const currentConfig = KeplerGlSchema.getConfigToSave(store.getState().keplerGl["covid"])
      const mapToLoad = firstRun ? initialMapToLoad : {}
      firstRun = false

      const bearing = (-40 + ((+endDate)-(+date))/86400000) || 0

      dispatch(
        addDataToMap({
          ...mapToLoad,

          datasets: {
            data,
            info: {
              label: "COVID data",
              id: "covid-data",
              "color": [
                187,
                0,
                0
              ]
            }
          },
          // option: {
          //   keepExistingConfig: true,
          //   centerMap: false,
          //   readOnly: true
          // }
        })
      )


      const mapState = (firstRun ? config : currentConfig).config.mapState

      dispatch(
        updateMap({
          ...mapState,
          bearing
        })
      )
    }

  }, [dispatch, data, config])

  return (
    <KeplerGl
      id="covid"
      mapboxApiAccessToken={window["MAPBOX_API_KEY"]}
      width={window.innerWidth}
      height={window.innerHeight}
    />
  )
})
