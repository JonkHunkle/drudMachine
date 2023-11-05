import PropTypes from 'prop-types';

export default function DrumPad({beat, track, color,updateTrackSequence }) {
    const handleClick = (e)=>{
      updateTrackSequence(e)
    }

  return (
    <div className={`drum-pad pad-${beat}`} style={{backgroundColor:color??null}}data-sequence={track.id} onClick={handleClick} name={beat}/>
  )
}
DrumPad.propTypes = {
    setMeasure: PropTypes.func, 
    updateTrackSequence: PropTypes.func, 
    setSoundBank: PropTypes.func, 
    soundBank: PropTypes.array, 
    measure: PropTypes.array, 
    track: PropTypes.object, 
    color: PropTypes.string, 
    beat: PropTypes.number
  };