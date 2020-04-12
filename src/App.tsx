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

  fips: string
}
const DataStore = new class {
  rows: Row[] = []
  rowsByDayNumber: Row[][] = []
  rowsByIdByDayNumber: {[key: string]: Row}[] = []
  first: Date
  last: Date
  maxStats = {}

  dayNumberForDate(date: Date): number {
    return Math.floor((+date - +this.first)/ONE_DAY)
  }

  forDayNumber(dayNumber: number) {
    return this.rowsByDayNumber[dayNumber]
  }

  adjustedForTimeOfDay(date) {
    const dayNumber = this.dayNumberForDate(date)

    const proportion = ((+date - +this.first) % ONE_DAY)/ONE_DAY

    const day1 = this.rowsByDayNumber[dayNumber]
    const day2 = this.rowsByDayNumber[dayNumber+1]

    function blendRowData(a: Row, b: Row) {
      const data = {}
      ;["cases", "deaths", "casesPer100K", "deathsPer100K"].forEach(field=> {
        data[field] = ((a?.[field]||0)*(1-proportion)) + (b[field]*proportion)
      })
      ;["cases", "deaths"].forEach(field=> {
        data[field] = Math.round(data[field])
      })
      return data
    }

    if (!day1 || !day2) return day1 || day2 || []

    const adjusted = day2.map(row2=> {
      const row1 = this.rowsByIdByDayNumber[dayNumber][this.idForRow(row2)]
      return ({
        ...row2,
        ...blendRowData(row1, row2)
      })
    })

    return adjusted
  }

  replaceRows(rows: Row[]) {
    this.rows = rows

    const dates = rows.map(d=> +new Date(d.date))

    this.first = new Date(Math.min(...dates))
    this.last  = new Date(Math.max(...dates))


    const byNum = []
    const byIdByNum = []

    this.maxStats = { lat: 35, long: -40, deaths: 0, cases: 0, deathsPer100K: 0, casesPer100K: 0 }

    rows.forEach(row=> {
      RegionsStore.add(row)

      const dayNumber = this.dayNumberForDate(new Date(row.date))

      byNum[dayNumber] || (byNum[dayNumber] = [])
      byNum[dayNumber].push(row)

      byIdByNum[dayNumber] || (byIdByNum[dayNumber] = {})
      byIdByNum[dayNumber][this.idForRow(row)] = row

      ;["cases", "deaths", "casesPer100K", "deathsPer100K"].forEach(field=>
        (row[field]>this.maxStats[field]) && (this.maxStats[field]=row[field])
      )
    })

    this.rowsByDayNumber     = byNum
    this.rowsByIdByDayNumber = byIdByNum
    // this.zeroFillRows()
  }

  zeroFillRows() {
    const zeroData = { deaths: 0, cases: 0, deathsPer100K: 0, casesPer100K: 0 }
    const lastDay = this.rowsByDayNumber[this.dayNumberForDate(this.last)]

    RegionsStore.all.forEach(region=> {
      const id = this.idForRow(region)

      for (let i=0; i<this.rowsByDayNumber.length; i++) {
        if (!this.rowsByIdByDayNumber[i][id]) {
          const date = this.rowsByDayNumber[i][0].date
          const zeroRow = {...region, ...zeroData, date}
          this.rowsByIdByDayNumber[i][id] = zeroRow
          this.rowsByDayNumber[i].push(zeroRow)
        }
      }
    })
  }

  idForRow(row: Row) {
    return row.fips
  }
}

type Region = {
  state: string
  subregion: string
  lat: number
  long: number
  population: number

  fips: string
}
const RegionsStore = new class {
  all: Region[] = []
  byId: {[key: string]: Region} = {}

  add(region: Region) {
    const id = this.idForRegion(region)
    if (!this.byId[id]) {
      this.byId[id] = region
      this.all.push(region)
    }
  }

  idForRegion(region: Region): string {
    return region.fips
  }
}



window["DataStore"] = DataStore


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
  if (rows.length) rows = rows.concat(DataStore.maxStats)
  const data = processForMap(rows)

  const renderControl = !!(start && end && value)

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
