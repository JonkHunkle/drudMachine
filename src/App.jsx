import { useEffect, useRef, useState, useCallback } from "react"
import DrumBox from "./components/DrumBox"

import * as Tone from 'tone'


function App() {
    const [measure, setMeasure] = useState([0,0,0,0,0,0,0,0])
    const measureRef = useRef([0,0,0,0,0,0,0,0])
  const [loop, setLoop] = useState(undefined);
  const [playing, setPlaying] = useState(false);
  const counterRef = useRef(0)
  const sound = useRef(new Tone.Synth({volume:5}).toDestination())
  const togglePlay = async () => {
      if (!playing) {
        loop.start();
      } else {
        loop.stop();
        counterRef.current = 0;
    const container = document.getElementById('box'); // Select the container
        measureRef.current.forEach((beat, i)=>{
          const specificDiv = container.getElementsByClassName('drum-pad')[i];
          if(beat===0)specificDiv.style.backgroundColor='white'
          else specificDiv.style.backgroundColor='aquamarine'
        })
      }
    setPlaying(!playing);
  };
  const play = useCallback((time) => {
    const container = document.getElementById('box'); // Select the container
    measureRef.current.forEach((beat, i) => {
      const specificDiv = container.getElementsByClassName('drum-pad')[i];
      if (i === counterRef.current){
        specificDiv.style.backgroundColor='red'
        if(beat===1){
        sound.current.triggerAttackRelease(
          "C2",
          "8n",
          time
      );
      }
    } else {
        if(beat===1){
        specificDiv.style.backgroundColor='aquamarine'
        } else specificDiv.style.backgroundColor='white'
    }
    })
  }, [sound]);
  const playSong = useCallback(
    (time) => {
      play(time);
      counterRef.current = (counterRef.current + 1) % 8;
    },
    [play],
  );

  useEffect(()=>{
if(measure!==measureRef.current){
measureRef.current=measure
    const container = document.getElementById('box'); // Select the container
    measureRef.current.forEach((beat, i)=>{
  const specificDiv = container.getElementsByClassName('drum-pad')[i];
  if(beat===0)specificDiv.style.backgroundColor='white'
  else specificDiv.style.backgroundColor='aquamarine'

})
}
  if (loop === undefined) {
    setLoop(new Tone.Loop(playSong, "8n"));
    Tone.loaded();
    Tone.start();
    Tone.Transport.timeSignature = 4 / 4;
    Tone.Transport.start();
  }
  return () => {
    loop?.dispose();
    setPlaying(false);
    counterRef.current = 0;
  };
},[loop, playSong, sound, measure])


  return (
    <div className='App'>
      {!playing?(<svg onClick={togglePlay} width="67" height="76" viewBox="0 0 67 76" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M63 31.0718C68.3333 34.151 68.3333 41.849 63 44.9282L12 74.3731C6.66667 77.4523 0 73.6033 0 67.4449L0 8.55514C0 2.39674 6.66667 -1.45227 12 1.62693L63 31.0718Z" fill="black"/>
</svg>
) : (<svg onClick={togglePlay} width="75" height="75" viewBox="0 0 75 75" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="75" height="75" rx="8" fill="black"/>
</svg>
)
}
      
      <DrumBox measure={measure} setMeasure={setMeasure} beat={counterRef} />
    </div>
  )
}

export default App
