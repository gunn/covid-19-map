import * as React from 'react'
import Map from './Map'


const ONE_DAY = 24*60*60*1000

type Row = {
  state: string
  subregion: string
  lat: number
  long: number
  population: number
  cases: number
  deaths: number
  casesPer100K: number
  deathsPer100K: number
  date: string
}
const DataStore = new class {
  rows: Row[] = []
  rowsByDayNumber: Row[][] = []
  first: Date
  last: Date

  dayNumberForDate(date: Date): number {
    return Math.floor((+date - +this.first)/ONE_DAY)
  }

  forDayNumber(dayNumber: number) {
    return this.rowsByDayNumber[dayNumber]
  }

  adjustedForTimeOfDay(date) {
    const dayNumber = this.dayNumberForDate(date)
    const day1 = this.rowsByDayNumber[dayNumber]
    const day2 = this.rowsByDayNumber[dayNumber+1]

    if (!day2) return day1 || []

    // TODO: adjust figures by interpolating between days
    return day1 || []
  }

  replaceRows(rows: Row[]) {
    this.rows = rows

    const dates = rows.map(d=> +new Date(d.date))

    console.log(dates.filter(d=> !d))

    this.first = new Date(Math.min(...dates))
    this.last  = new Date(Math.max(...dates))

    this.rowsByDayNumber = rows.reduce((obj, row)=> {
      const dayNumber = this.dayNumberForDate(new Date(row.date))
      obj[dayNumber] || (obj[dayNumber] = [])
      obj[dayNumber].push(row)
      return obj
    }, [])
  }
}


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

  const data = processForMap(DataStore.adjustedForTimeOfDay(value))



  const renderControl = !!(start && end && value)
  console.log(value)

  return (
    <>
      <Map
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


type DateControlProps = {
  start: Date
  end: Date
  value: Date
  onChange: (Function)=> void
}
const DateControl = ({start, end, value, onChange}: DateControlProps)=> {

  return (
    <div className="date-control">
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
