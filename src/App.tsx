import * as React from 'react'
import Map from './Map'
import { StatsStore, Row, processForMap } from './stats-store'
import createStore, { PureStore } from 'pure-store'

import { EditInPlace, ProgressButton} from './components'
import defaultMapConfig from './default-map-config'


const store = createStore({
  name: "",
  date: new Date(2020, 3),
  config: null
})


function useForceUpdate() {
  return React.useReducer(() => ({}), {})[1] as () => void
}


export default ()=> {
  const [state, update] = store.usePureStore()
  const { date, config } = state
  const forceUpdate = useForceUpdate()
  const configGetter = React.useRef<Function>(null)

  const start = StatsStore.first
  const end   = StatsStore.last

  
  async function saveToEverDB() {
    const data = {
      ...state,
      config: configGetter.current?.()
    }

    const resp = await fetch("https://covid-data.everdb.net/covid.map.json", {
      method: "POST",
      body: JSON.stringify(data)
    })
    const json = await resp.json()
    return json._id
  }


  React.useEffect(()=> {
    (async ()=> {
      const resp = await fetch("https://storage.googleapis.com/edb-covid-files/hYSGamt4Da4ScLZiW")
      const rawData = await resp.json()
  
      StatsStore.replaceRows(rawData)
      forceUpdate()
    })()

    ;(async ()=> {
      const mapId = getQueryVariable("mapId")
      if (mapId) {
        const resp = await fetch(`https://covid-data.everdb.net/covid.map/${mapId}.json`)

        if (resp.ok) {
          const edbData = await resp.json()
          const { name, date, dataSource, config } = edbData
          return (
            update({
              ...{name, dataSource, config},
              date: new Date(date)
            })
          )
        }
      }
  
      return update({ config: defaultMapConfig })
    })()
  }, [])

  let rows = StatsStore.adjustedForTimeOfDay(date)
  if (rows.length) rows = rows.concat(StatsStore.maxStats as Row)
  const data = processForMap(rows)

  const renderControl = !!(start && end && date)


  return (
    <>
      <Map
        endDate={end}
        date={date}
        data={data}
        config={config}
        configGetter={configGetter}
      />

      {
        renderControl &&
        <BottomControls
          start={start}
          end={end}
          onSave={saveToEverDB}
        />
      }
    </>
  )
}


const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

type BottomControlsProps = {
  start: Date
  end: Date
  onSave: Function
}
const BottomControls = ({start, end, onSave}: BottomControlsProps)=> {
  const [saving, setSaving] = React.useState(false)
  const [{ name, date }, update] = usePureStore(store)

  async function save() {
    if (saving) return null

    setSaving(true)
    const id = await onSave()
    if (id) {
      window.history?.pushState({}, null, `/map/?mapId=${id}`)
      alert(`Share this map as: https://covid.everdb.net/map/?mapId=${id}`)
    }
    setSaving(false)
  }

  return (
    <div className="bottom-controls">
      <h3>
        <span className="title">
          <EditInPlace
            value={name}
            placeholder="Click to edit title, press enter to confirm"
            onChange={name=> update({ name })}
          />
        </span>

        <span className="date">
          { date.getDate() } { MONTHS[date.getMonth()] } 2020
        </span>
      </h3>

      <a href="https://covid.everdb.net" className="edb-link">
        covid.everdb.net
      </a>

      <div className="row">
        <div className="date-control">
          <input
            type="range"
            value={date.getTime()}
            onChange={e=> update({ date: new Date(Math.floor(+e.target.value)) })}
            min={start.getTime()}
            max={end.getTime()}
          />
        </div>

        <ProgressButton
          text="SAVE"
          loading={saving}
          onClick={save}
        />
      </div>
    </div>
  )
}


function getQueryVariable(variable) {
  var query = window.location.search.substring(1)
  var vars = query.split('&')

  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split('=')

    if (decodeURIComponent(pair[0]) == variable) {
      return decodeURIComponent(pair[1])
    }
  }
}
