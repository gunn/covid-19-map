import * as React from 'react'
import Map from './Map'
import { StatsStore, Row } from './stats-store'
import createStore, { PureStore } from 'pure-store'

import defaultMapConfig from './default-map-config'


const store = createStore({
  name: "",
  date: new Date(2020, 3),
  config: null
})


function useForceUpdate() {
  return React.useReducer(() => ({}), {})[1] as () => void
}

function usePureStore<S, T>(store: PureStore<S, T>) {
  const forceUpdate = useForceUpdate()

  React.useEffect(()=> {
    const unsubscribe = store.subscribe(forceUpdate)
    return unsubscribe
  }, [])

  return [store.state, store.update] as [T, (updater: Partial<T> | ((e: T) => void))=> void]
}


export default ()=> {
  const [{ date, config }, update] = usePureStore(store)
  const forceUpdate = useForceUpdate()
  const configGetter = React.useRef<Function>(null)

  const start = StatsStore.first
  const end   = StatsStore.last

  
  async function saveToEverDB() {
    const data = {
      ...store.state,
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
      const resp = await fetch("http://127.0.0.1:8080/outputs/nyt.json")
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
          return (
            update({
              ...edbData,
              date: new Date(edbData.date)
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
      window.history?.pushState({}, null, `/?mapId=${id}`)
      alert(`Share this map as: http://covid.everdb.net/map?mapId=${id}`)
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



type ProgressButtonProps = {
  text: string
  loading: boolean
  onClick: (e: any)=> void
}
const ProgressButton = React.memo(({text, loading=false, onClick}: ProgressButtonProps)=> {
  const svg = (
    <svg style={{ width: 15, fill: "#CCC" }} xmlns="http://www.w3.org/2000/svg" id="icon-refresh" aria-label="refresh icon" viewBox="0 0 512 512"><path d="M370.72 133.28C339.458 104.008 298.888 87.962 255.848 88c-77.458.068-144.328 53.178-162.791 126.85-1.344 5.363-6.122 9.15-11.651 9.15H24.103c-7.498 0-13.194-6.807-11.807-14.176C33.933 94.924 134.813 8 256 8c66.448 0 126.791 26.136 171.315 68.685L463.03 40.97C478.149 25.851 504 36.559 504 57.941V192c0 13.255-10.745 24-24 24H345.941c-21.382 0-32.09-25.851-16.971-40.971l41.75-41.749zM32 296h134.059c21.382 0 32.09 25.851 16.971 40.971l-41.75 41.75c31.262 29.273 71.835 45.319 114.876 45.28 77.418-.07 144.315-53.144 162.787-126.849 1.344-5.363 6.122-9.15 11.651-9.15h57.304c7.498 0 13.194 6.807 11.807 14.176C478.067 417.076 377.187 504 256 504c-66.448 0-126.791-26.136-171.315-68.685L48.97 471.03C33.851 486.149 8 475.441 8 454.059V320c0-13.255 10.745-24 24-24z"></path></svg>
  )

  return (
    <div className="progress-button" style={{width: 50}} onClick={onClick}>
      { loading ? svg : text }
      {/* { svg } */}
    </div>
  )
})



type EditInPlaceProps = {
  value: string
  placeholder: string
  onChange: (text: string)=> void
}
const EditInPlace = React.memo(({value, placeholder, onChange}: EditInPlaceProps)=> {
  const [editing, setEditing] = React.useState(false)

  function onInput(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key=="Enter") {
      onChange((e.target as HTMLInputElement).value)
      setEditing(false)
    } else if (e.key=="Escape") {
      setEditing(false)
    }
  }

  if (editing) {
    return (
      <span className="edit-in-place">
        <input
          type="text"
          defaultValue={value}
          onKeyDown={onInput}
          style={{
            color: "inherit",
            font: "inherit",
            borderWidth: 1,
            borderStyle: "solid"
          }}
        />
      </span>
    )
  }

  return (
    <span
      className="edit-in-place"
      onClick={()=> setEditing(true)}
      style={{
        opacity: value ? 1 : 0.5
      }}
    >
      { value || placeholder }
    </span>
  )
})



function processForMap(rawData: any[]) {
  const fields = [ 
    {name: 'state',         type: 'string'},
    {name: 'subregion',     type: 'string'},
    {name: 'lat',           type: 'real'},
    {name: 'long',          type: 'real'},
    {name: 'population',    type: 'integer'},
    {name: 'cases',         type: 'integer'},
    {name: 'deaths',        type: 'integer'},
    {name: 'casesPer100K',  type: 'real'},
    {name: 'deathsPer100K', type: 'real'},
    {name: 'date',          type: 'timestamp'},
  ]

  const fieldNames = fields.map(d=> d.name)
  const rows = rawData.map(rowObj=>
    fieldNames.map(name=> rowObj[name])
  )
  
  return { fields, rows }
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
