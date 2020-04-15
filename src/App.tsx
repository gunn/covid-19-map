import * as React from 'react'
import Map from './Map'
import { DataStore, Row } from './data-stores'



export default ()=> {
  const start = DataStore.first
  const end   = DataStore.last

  const [value, setValue] = React.useState(new Date(2020, 3))
  const [_, forceUpdate] = React.useState(0)

  React.useEffect(()=> {(async ()=> {
    const resp = await fetch("http://127.0.0.1:8080/outputs/nyt.json")
    const rawData = await resp.json()

    // setData(processForMap(rawData))
    DataStore.replaceRows(rawData)
    forceUpdate(Math.random())
  })()}, [])

  let rows = DataStore.adjustedForTimeOfDay(value)
  if (rows.length) rows = rows.concat(DataStore.maxStats as Row)
  const data = processForMap(rows)

  const renderControl = !!(start && end && value)

  return (
    <>
      <Map
        endDate={end}
        date={value}
        data={data}
      />

      {
        renderControl &&
        <DateControl
          start={start}
          end={end}
          value={value}
          onChange={setValue}
        />
      }
    </>
  )
}


const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

type DateControlProps = {
  start: Date
  end: Date
  value: Date
  onChange: (Function)=> void
}
const DateControl = ({start, end, value, onChange}: DateControlProps)=> {

  return (
    <div className="date-control">
      <h3 style={{textAlign: "right"}}>
        <a href="https://covid.everdb.net" className="edb-link">
          covid.everdb.net
        </a>

        <span className="date">
          { value.getDate() } { MONTHS[value.getMonth()] } 2020
        </span>
      </h3>

      <input
        type="range"
        value={value.getTime()}
        onChange={e=> onChange(new Date(Math.floor(+e.target.value)))}
        min={start.getTime()}
        max={end.getTime()}
      />
    </div>
  )
}



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
