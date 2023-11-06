import { useEffect, useRef, useState, useCallback } from "react"
import { v4 as uuidv4 } from 'uuid';
import * as Tone from 'tone'
import DrumPad from "./components/DrumPad";

function App() {
  const [loop, setLoop] = useState(null);
  const [playing, setPlaying] = useState(false);
  const counterRef = useRef(1)
  const [masterGain, setMasterGain] = useState(null);
  const [soundBank, setSoundBank] = useState([])
  const soundBankRef = useRef([])

  const togglePlay = async () => {
    if (!playing) {
      Tone.loaded()
      loop.start();
    } else {
      loop.stop();
      counterRef.current = 1;
      resetPadColors()
    }
    setPlaying(!playing);
  };

  const renderPads = (track) => {
    const drumPads = [];
    let color
    for (let i = 1; i <= 8; i++) {
      color = track.sequence[i-1]? 'aquamarine':null
        drumPads.push(<DrumPad  track={track} key={track.id+'-'+i} beat={i} updateTrackSequence={updateTrackSequence} color={color}/>);
    }
    return drumPads;
}

const updateTrackSequence = (e) => {
  const trackId = e.target.getAttribute("data-sequence");
  const beatInSequence = e.target.getAttribute("name");
  const soundBankCopy = [...soundBank];

  let updatedBank = soundBankCopy.map((track, i)=>{
    if (trackId===track.id){
      track.sequence[beatInSequence-1]=!track.sequence[beatInSequence-1]
      return track
    }else return track
  })
  setSoundBank(updatedBank);
  soundBankRef.current=updatedBank
};

const addNewSequence= ()=>{
  let soundBankCopy = [...soundBank]
  let trackVolume = new Tone.Gain(2).connect(masterGain)
  let newInstrument = new Tone.Synth().connect(trackVolume)
  let track ={
    sequence: new Array(8).fill(false),
    track :newInstrument ,
    volume: trackVolume,
    id: uuidv4()
  }
  soundBankCopy.push(track)
  soundBankRef.current=soundBankCopy
  setSoundBank(soundBankCopy)
}

const resetPadColors= ()=>{
      const allPads = Array.from(document.getElementsByClassName('drum-pad'));
      const soundBankCopy = [...soundBankRef.current];
      allPads.forEach(pad=>{
        const beatInSequence = pad.getAttribute('name');
        const trackId = pad.getAttribute("data-sequence");
        let foundTrack = soundBankCopy.find(track => trackId === track.id)
        soundBankCopy.forEach((track, i)=>{
          if(trackId===track.id && track.sequence[Number(beatInSequence)-1]) pad.style.backgroundColor = 'aquamarine'
          else if(!foundTrack.sequence[Number(beatInSequence)-1]) pad.style.backgroundColor = 'white'
        })
      })
}

const play = useCallback( (time) => {
  const allPads = Array.from(document.getElementsByClassName('drum-pad'));
  const soundBankCopy = [...soundBankRef.current];
  
  for (let track of soundBankCopy){
    if(track.sequence[counterRef.current-1])
    track.track.triggerAttackRelease('C2', '8n', time);
  }

  for (let pad of allPads){
    const beatInSequence = Number(pad.getAttribute('name'));
    const trackId = pad.getAttribute("data-sequence");
    let foundTrack = soundBankCopy.find(track =>track.id ===trackId)
    if (Number(pad.getAttribute('name'))=== counterRef.current){
      pad.style.backgroundColor = 'red';
    }
    pad.style.backgroundColor = beatInSequence === counterRef.current ? 'red' : (foundTrack.sequence[beatInSequence-1]?'aquamarine':'white');
  }
}, []);

  const playSong = useCallback( (time) => {
    play(time);
    counterRef.current = (counterRef.current % 8) + 1; // Update the current beat
},[play]);


  useEffect(()=>{
    if (!loop) {
      Tone.start();
      Tone.loaded();
      setLoop(new Tone.Loop(playSong, "8n")); // update to handle dynamic subdivisions
      Tone.Transport.timeSignature = 4 / 4;
      Tone.Transport.start();
  }
  if(!masterGain){
    let initMaster = new Tone.Gain(2).toDestination()
    initMaster.id = uuidv4()
    setMasterGain(initMaster)
    }
  return () => {
    loop?.dispose();
    setPlaying(false);
    counterRef.current = 1;
    resetPadColors()

  };
},[loop, playSong, masterGain])


  return (
    <div className='App'>
      <button style={{fontSize:'1rem', height:'min-content'}} onClick={addNewSequence}>Add Track</button>
      {!playing?(<svg onClick={togglePlay} width="67" height="76" viewBox="0 0 67 76" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M63 31.0718C68.3333 34.151 68.3333 41.849 63 44.9282L12 74.3731C6.66667 77.4523 0 73.6033 0 67.4449L0 8.55514C0 2.39674 6.66667 -1.45227 12 1.62693L63 31.0718Z" fill="black"/>
</svg>
) : (<svg onClick={togglePlay} width="75" height="75" viewBox="0 0 75 75" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="75" height="75" rx="8" fill="black"/>
</svg>
)
}
<div className='box' id='box'>
        {
        soundBank?.length>0 && soundBank.map((track) => {
          return renderPads(track)
        })
        }
    </div>
    </div>
  )
}

export default App
