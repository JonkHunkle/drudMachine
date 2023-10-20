import PropTypes from 'prop-types';
import { useState } from 'react';

export default function DrumPad({spot, measure, setMeasure }) {
    const [active, setActive] = useState(false)


    const handleClick = (e)=>{
        let measureCopy=[...measure]
        const pad = document.getElementById(e.target.id)
        if(active){
            pad.style.backgroundColor='white'
        } else{
            pad.style.backgroundColor='aquamarine'
        }
        if(measureCopy[spot]===0){
            measureCopy[spot]=1
        }else measureCopy[spot] =0
        setActive(!active)
        setMeasure([...measureCopy])

    }
  return (
    <div className="drum-pad" onClick={handleClick} name={spot} id ={`pad-${spot}`}/>
  )
}
DrumPad.propTypes = {
    setMeasure: PropTypes.func, 
    measure: PropTypes.array, 
    spot: PropTypes.number.isRequired, 
  };