import * as React from 'react'
import Map from './Map'
import { StatsStore, Row } from './stats-store'
import createStore, { PureStore } from 'pure-store'


const store = createStore({
  title: "",
  date: new Date(2020, 3)
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
  const [{ date }, update] = usePureStore(store)
  const forceUpdate = useForceUpdate()

  const start = StatsStore.first
  const end   = StatsStore.last
  // const start = new Date(2020, 0)
  // const end   = new Date(2020, 4)

  React.useEffect(()=> {(async ()=> {
    const resp = await fetch("http://127.0.0.1:8080/outputs/nyt.json")
    const rawData = await resp.json()

    StatsStore.replaceRows(rawData)
    forceUpdate()
  })()}, [])

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
      />

      {
        renderControl &&
        <BottomControls
          start={start}
          end={end}
        />
      }
    </>
  )
}


const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

type BottomControlsProps = {
  start: Date
  end: Date
}
const BottomControls = ({start, end}: BottomControlsProps)=> {
  const [{ title, date }, update] = usePureStore(store)

  return (
    <div className="bottom-controls">
      <h3>
        <span className="title">
          <EditInPlace
            value={title}
            placeholder="Click to edit title, press enter to confirm"
            onChange={title=> update({ title })}
          />
        </span>

        <span className="date">
          { date.getDate() } { MONTHS[date.getMonth()] } 2020
        </span>
      </h3>

      <a href="https://covid.everdb.net" className="edb-link">
        covid.everdb.net
      </a>

      <div className="date-control">
        <input
          type="range"
          value={date.getTime()}
          onChange={e=> update({ date: new Date(Math.floor(+e.target.value)) })}
          min={start.getTime()}
          max={end.getTime()}
        />
      </div>
    </div>
  )
}


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
