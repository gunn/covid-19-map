import * as React from 'react'
import Map from './Map'


export default ()=> {
  const [data, setData] = React.useState({})

  React.useEffect(()=> {(async ()=> {
    const resp = await fetch("http://127.0.0.1:8080/outputs/nyt.json")
    const rawData = await resp.json()

    setData(processForMap(rawData))
  })()}, [])

  return (
    <Map
      data={data}
    />
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
