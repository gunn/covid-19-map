import * as React from 'react'


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


export {
  ProgressButton,
  EditInPlace
}
