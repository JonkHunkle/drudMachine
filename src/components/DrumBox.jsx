import DrumPad from "./DrumPad"
import { PropTypes } from 'prop-types';

export default function DrumBox({measure, setMeasure}) {

    
    const renderPads = () => {
        const drumPads = [];
        for (let i = 0; i <8; i++) {
            drumPads.push(<DrumPad key={i}setMeasure={setMeasure} measure={measure} spot={i} />);
        }
        return drumPads;
    }
  return (
    <div className='box' id='box'>
        {renderPads()}
    </div>
  )
}

DrumBox.propTypes = {
    setMeasure: PropTypes.func, 
    measure: PropTypes.array, 
  };