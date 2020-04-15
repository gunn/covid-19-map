import * as React from 'react'
import KeplerGl from 'kepler.gl'

import { createStore, combineReducers, applyMiddleware } from 'redux'
import { taskMiddleware } from 'react-palm/tasks'
import { Provider, useDispatch } from 'react-redux'

import KeplerGlSchema from 'kepler.gl/schemas'
import keplerGlReducer from 'kepler.gl/reducers'
import { addDataToMap, updateMap } from 'kepler.gl/actions'


const reducers = combineReducers({
  keplerGl: keplerGlReducer
})

const store = createStore(reducers, {}, applyMiddleware(taskMiddleware))


type MapProps = {
  endDate: Date
  date: Date
  data: any
}
export default (props: MapProps)=> (
  <Provider store={store}>
    <Map {...props} />
  </Provider>
)


let firstRun = true
let startTime

const Map = React.memo(({data, endDate, date}: MapProps)=> {
  const dispatch = useDispatch()
  const [_, forceUpdate] = React.useState(0)

  React.useEffect(()=> {
    dispatch(addDataToMap(initialMapToLoad))

    window.addEventListener("resize", ()=> forceUpdate(Math.random()))
  }, [])

  React.useEffect(() => {
    if (data?.rows.length) {
      const currentConfig = KeplerGlSchema.getConfigToSave(store.getState().keplerGl["covid"])
      const mapToLoad = firstRun ? initialMapToLoad : {}
      if (firstRun) startTime = new Date()
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


const config = {
  "version": "v1",
  "config": {
    "visState": {
      "filters": [],
      "layers": [
        {
          "id": "hrtxigu",
          "type": "hexagon",
          "config": {
            "dataId": "covid-data",
            "label": "new layer",
            "color": [
              130,
              154,
              227
            ],
            "columns": {
              "lat": "lat",
              "lng": "long"
            },
            "isVisible": true,
            "visConfig": {
              "opacity": 0.8,
              "worldUnitSize": 16,
              "resolution": 8,
              "colorRange": {
                "name": "Global Warming",
                "type": "sequential",
                "category": "Uber",
                "colors": [
                  "#5A1846",
                  "#900C3F",
                  "#C70039",
                  "#E3611C",
                  "#F1920E",
                  "#FFC300"
                ]
              },
              "coverage": 1,
              "sizeRange": [
                0,
                1000
              ],
              "percentile": [
                0,
                100
              ],
              "elevationPercentile": [
                0,
                100
              ],
              "elevationScale": 82.8,
              "colorAggregation": "sum",
              "sizeAggregation": "average",
              "enable3d": true
            },
            "textLabel": [
              {
                "field": null,
                "color": [
                  255,
                  255,
                  255
                ],
                "size": 18,
                "offset": [
                  0,
                  0
                ],
                "anchor": "start",
                "alignment": "center"
              }
            ]
          },
          "visualChannels": {
            "colorField": {
              "name": "cases",
              "type": "integer"
            },
            "colorScale": "quantile",
            "sizeField": {
              "name": "deathsPer100K",
              "type": "real"
            },
            "sizeScale": "linear"
          }
        }
      ],
      "interactionConfig": {
        "tooltip": {
          "fieldsToShow": {
            "covid-data": [
              "state",
              "subregion",
              "long",
              "population",
              "cases"
            ]
          },
          "enabled": true
        },
        "brush": {
          "size": 0.5,
          "enabled": false
        },
        "coordinate": {
          "enabled": false
        }
      },
      "layerBlending": "normal",
      "splitMaps": [],
      "animationConfig": {
        "currentTime": null,
        "speed": 1
      }
    },
    "mapState": {
      "bearing": 0,
      "dragRotate": false,
      "latitude": 39.15690502140835,
      "longitude": -104.29845290568925,
      "pitch": 0,
      "zoom": 3.9304282529358545,
      "isSplit": false
    },
    "mapStyle": {
      "styleType": "dark",
      "topLayerGroups": {},
      "visibleLayerGroups": {
        "label": false,
        "road": true,
        "border": false,
        "building": true,
        "water": true,
        "land": true,
        "3d building": false
      },
      "threeDBuildingColor": [
        9.665468314072013,
        17.18305478057247,
        31.1442867897876
      ],
      "mapStyles": {}
    }
  }
}

const initialMapToLoad = KeplerGlSchema.load([], config)
