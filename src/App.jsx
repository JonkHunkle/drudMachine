import { useEffect, useRef, useState, useCallback } from "react"
import { v4 as uuidv4 } from 'uuid';
import * as Tone from 'tone'
import DrumPad from "./components/DrumPad";
import snare from './assets/Samples/snare.wav'
import kick from './assets/Samples/kick.wav'
import { openDatabase, saveToDB, getFileFromDB, getAllFromDB, deleteDatabase } from './IndexDB/indexedDB';
function App() {
  const [loop, setLoop] = useState(null);
  const [playing, setPlaying] = useState(false);
  const counterRef = useRef(0)
  const [masterGain, setMasterGain] = useState(null);
  const [soundBank, setSoundBank] = useState([])
  const soundBankRef = useRef(null)
  const togglePlay = async () => {
    if (!playing) {
      Tone.loaded().then(async()=>{
        await Tone.start()
        loop.interval='16n'
        await loop.start();
        Tone.Transport.start();
      })
    } else {
      loop.stop();
      // Tone.Transport.position=0
      Tone.Transport.stop()
      resetPadColors()
      counterRef.current = 0;
    }
    setPlaying(!playing);

  };

  const renderPads = (track) => {
    const drumPads = [];
    let color
    let namePlate= (<div style={{textAlign:'center', flexDirection:'column', display:'flex', justifyContent:'center', fontSize:'.5rem'}}>{track.label}</div>)
    drumPads.push(namePlate)
    for (let i = 0; i < 8; i++) {
      color = track.sequence[i]? 'aquamarine':null
        drumPads.push(<DrumPad  track={track} key={track.id+'-'+i} beat={i} updateTrackSequence={updateTrackSequence} color={color}/>);
    }
    return drumPads;
}
const updateTrackSequence = (e) => {
  const trackId = e.target.getAttribute("data-sequence");
  const beatInSequence = Number(e.target.getAttribute("name"));
  const soundBankCopy = [...soundBank];
  let updatedBank = soundBankCopy.map((track)=>{
    if (trackId===track.id){
      track.sequence[beatInSequence]=!track.sequence[beatInSequence]
      return track
    }else return track
  })
  setSoundBank(updatedBank);
  soundBankRef.current=[...updatedBank]
  updateLocalStorage(updatedBank)
};

const addNewSequence = async (e) => {
      try {
    let sound = e.target.value
    if(sound){

    let soundBankCopy = [...soundBank]
    let trackVolume = new Tone.Gain(2).connect(masterGain);

    const buffer = new Tone.Buffer()

      switch (sound) {
        case 'snare':
     buffer.load(snare)
          
          break;
        case 'kick':
     buffer.load(kick)
          
          break;
          case 'file':
          document.getElementById('fileInput').click();
          e.target.value = ''
          return
      
        default:
          break;
      }
    // Create a new Tone.Sampler and attach the loaded buffer
    const newInstrument = new Tone.Sampler({
      C2: buffer,
    }).connect(trackVolume);

    let track = {
      sequence: new Array(8).fill(false),
      track: newInstrument,
      id: uuidv4(),
      url: sound==='snare'? snare: kick,
      name:sound,
      label:sound
    };

    soundBankCopy.push(track);
    const samplerData = soundBankCopy.map(sampler => {
      return {
        track:sampler.track.get(),
        sequence: sampler.sequence,
        id: sampler.id,
        name:sampler.name,
      label:sound

      };
    });
    localStorage.setItem('samplers', JSON.stringify(samplerData));
    soundBankRef.current = [...soundBankCopy];
    setSoundBank(soundBankCopy);
  }
} catch (error) {
  console.error('An error occurred while loading the sample:', error);
}
  e.target.value = ''
};

const updateLocalStorage=(soundBankCopy)=>{
  const samplerData = soundBankCopy.map(sampler => {
    return {
      track:sampler?.track.get(),
      sequence: sampler.sequence,
      id: sampler.id,
      name:sampler.name,
      label:sampler.label
    };
  });
  localStorage.setItem('samplers', JSON.stringify(samplerData));
}


const resetPadColors= ()=>{
      const allPads = Array.from(document.getElementsByClassName('drum-pad'));
      if (soundBankRef.current){
      const soundBankCopy = [...soundBankRef.current];
      allPads.forEach(pad=>{
      const beatInSequence = Number(pad.getAttribute('name'));
        const trackId = pad.getAttribute("data-sequence");
        let foundTrack = soundBankCopy.find(track => trackId === track.id)
        soundBankCopy.forEach((track)=>{
          if(trackId===track.id && track.sequence[beatInSequence]) pad.style.backgroundColor = 'aquamarine'
          else if(!foundTrack.sequence[beatInSequence]) pad.style.backgroundColor = 'white'
        })
      })
    }
}

const play = useCallback(  (time) => {
  const allPads = Array.from(document.getElementsByClassName('drum-pad'));
  const soundBankCopy = [...soundBankRef.current];
    for (let pad of allPads){
      const beatInSequence = Number(pad.getAttribute('name'));
      const trackId = pad.getAttribute("data-sequence");
      let foundTrack = soundBankCopy.find(track =>track.id ===trackId)
      if(trackId===foundTrack.id &&  foundTrack.sequence[beatInSequence]) pad.style.backgroundColor = 'aquamarine'
      if(!foundTrack.sequence[beatInSequence]) pad.style.backgroundColor = 'white'
      if (beatInSequence === counterRef.current){
        pad.style.backgroundColor = 'red'; 
      }
    }
}, []);
const playSong = useCallback( async (time) => {
  let drift = Tone.Transport.now() - Tone.Transport.getSecondsAtTime();
  // let loopedTime = adjustedTime % ((60 / Tone.Transport.bpm.value) * 8);
  const secondsPerBeat = 60 / Tone.Transport.bpm.value;
  let expectedTime = counterRef.current* secondsPerBeat
  const totalRelativeTime = secondsPerBeat * 8;
  let adjustedTime = (time-drift) % totalRelativeTime;
  let loopedTime = adjustedTime % totalRelativeTime;

  // Check if loopedTime is within ±0.1 of counterRef.current


  // if (Math.abs(adjustedTime - expectedTime) <= 0.01) {
    for (let track of soundBankRef.current){
        track.sequence.forEach( async (beat, i)=>{
          if(beat && i === counterRef.current){
            console.log('playing')
              await track.track.triggerAttackRelease('C3', '16n', time);  
          }
        })
      }
      play(adjustedTime);
      counterRef.current = (counterRef.current +1)%8;
// }
}, [play]);

const handleFileSelect = async (e) => {
  const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type === 'audio/wav') {
            let url = URL.createObjectURL(selectedFile);
            let soundBankCopy = [...soundBank];
            let trackVolume = new Tone.Gain(1).connect(masterGain);

            const buffer = new Tone.Buffer()
            await buffer.load(url)

            let bufferArray=buffer.toArray()

            const newInstrument = new Tone.Sampler({
              C2: buffer,
            }).connect(trackVolume);
            let track = {
              sequence: new Array(8).fill(false),
              track: newInstrument,
              id: uuidv4(),
              name:'file',
              label:'Imported Audio'
            };

            soundBankCopy.push(track);
            soundBankRef.current = soundBankCopy;
            setSoundBank(soundBankCopy);

            const db = await openDatabase('audioDatabase', 3, (db) => {
        if (!db.objectStoreNames.contains('session')) {
          db.createObjectStore('session', { keyPath: 'id' });
        }
      });

      // Save the audio file to  IndexedDB and update local storage
      await saveToDB(db, 'session', {id:track.id, selectedFile});
      updateLocalStorage(soundBankCopy)
      
          } else {
            alert('Please select a valid WAV file.');
          }
    }
};


const updateVolume=(e)=>{
  const {value}=e.target
  let masterGainCopy={...masterGain}
  if (value <= 0) {
    masterGainCopy.gain.value= -Infinity;
  setMasterGain(masterGainCopy)
  localStorage.setItem('master', JSON.stringify({gain:-Infinity}));
    return
  }
  const decibelLevel = 20 * Math.log10(value);
  const formattedLevel = (Math.pow(10, decibelLevel / 20));
  masterGainCopy.gain.value=formattedLevel

  setMasterGain(masterGainCopy)
  localStorage.setItem('master', JSON.stringify({gain:formattedLevel}));
  



}



useEffect(()=>{
  if (!loop) {
    setLoop(new Tone.Loop(playSong, "16n")); // update to handle dynamic subdivisions
  }
  if(!masterGain){
      const savedMaster = JSON.parse(localStorage.getItem('master')) || null;

      Tone.Transport.fadeIn = 0,
      Tone.Transport.timeSignature = 4 / 4,
      Tone.Transport.bpm.value=80
    let initMaster = new Tone.Gain(savedMaster?{...savedMaster}:0).toDestination()
    if(!savedMaster){
      initMaster.id = uuidv4()
      localStorage.setItem('master', JSON.stringify(initMaster.get()));
    }
    setMasterGain(initMaster)
    }

    const findUserAudio = async (id)=>{
      //open db
      const db = await openDatabase('audioDatabase', 3, (db) => {
        //if no store in the db with selected name, create one
        if (!db.objectStoreNames.contains('session')) {
          db.createObjectStore('session', { keyPath: 'id', autoIncrement:true });
        }
      });
      //get sound from db via sampler id
      const res = await getFileFromDB(db, 'session', id);
          let url = URL.createObjectURL(res.selectedFile);
      return url
    }


    const loadBuffer = (sampler)=>{
      const buffer = new Tone.Buffer()
      
      switch (sampler.name) {
        case 'snare':
       buffer.load(snare)
          
          break;
        case 'kick':
       buffer.load(kick)
          
          break;
          case 'file':
          // find user audio in idb and load into buffer
         findUserAudio(sampler.id, buffer).then(url=>{
            buffer.load(url)
         })
          break
        default:
          break;
      }
      return buffer
    }


    if(soundBankRef.current===null && masterGain){
      let initSoundBank=[]
      //get local storage
      const storedSessionSamplers = JSON.parse(localStorage.getItem('samplers')) || [];
      //loop through items
      for (let sampler of storedSessionSamplers){
        // try to make buffer/sampler
        try {
          let samplerVolume = new Tone.Gain().connect(masterGain);
          
          let buffer = loadBuffer(sampler)
          
          const newInstrument = new Tone.Sampler({
            ...sampler.track,
            urls:{C2: buffer}
          }).connect(samplerVolume);

          let track = {
            sequence: sampler.sequence,
            track: newInstrument,
            id: sampler.id,
            // url: sampler.name==='snare'? snare: kick,
            name:sampler.name,
            label:sampler.label
          };
      
          // push to session_sequencer copy
          initSoundBank.push(track);
        } catch (error) {
          console.error('An error occurred while loading the sample:', error);
        }
      }
      //update state
      soundBankRef.current = initSoundBank;
      setSoundBank(initSoundBank);
    }
    // const scheduleBeats = () => {
    //   if (Tone.loaded()) {
    //     const bpm = 120; // Set the BPM (beats per minute)
    //     Tone.Transport.bpm.value = bpm; // Set the tempo
    //     const beatsPerBar = 4; // Define beats per bar
    //     const numBars = 4; // Define the number of bars
    //     const subdivision = '16n'; // Define the subdivision of the beat (quarter note)

    //       for (let beat = 0; beat < 16; beat++) {
    //         const time = `0:${beat}:${subdivision}`;
    //         Tone.Transport.schedule((time) => {
    //           console.log(`Beat (${beat}) at time: ${time}`);
    //           // Add your logic here to trigger actions at each beat
    //         }, time);
    //       }
    //     }

    //     Tone.Transport.start();
    //   }

    // scheduleBeats();
  return () => {
    // loop?.dispose();
    // Tone.Transport?.cancel()
    // setPlaying(false);
    // counterRef.current = 0;
    // resetPadColors()
  };
},[loop, playSong, masterGain])


  return (
    <div className='App'>
      <select onChange={addNewSequence} defaultValue=''>
        <option hidden value=''>select a sound</option>
        <option value='file'>use your own</option>
        <option value="snare">snare</option>
        <option value="kick">kick</option>
      </select>
      <button onClick={()=>document.getElementById('fileInput').click()}>import a sound</button>
      <input onChange={handleFileSelect} type="file" id='fileInput' accept='.wav'style={{display:'none'}}/>
      {/* <button style={{fontSize:'1rem', height:'min-content'}} onClick={addNewSequence}>Add Track</button> */}
      <div style={{display:'flex', gap:'1rem'}}>
<input onChange={updateVolume} value={masterGain?.gain?.value??0} type="range" min={0} max={1} step={.001}/>
      {!playing?(<svg onClick={togglePlay} width="67" height="76" viewBox="0 0 67 76" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M63 31.0718C68.3333 34.151 68.3333 41.849 63 44.9282L12 74.3731C6.66667 77.4523 0 73.6033 0 67.4449L0 8.55514C0 2.39674 6.66667 -1.45227 12 1.62693L63 31.0718Z" fill="black"/>
</svg>
) : (<svg onClick={togglePlay} width="75" height="75" viewBox="0 0 75 75" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="75" height="75" rx="8" fill="black"/>
</svg>
)
}
</div>
<div className='box' id='box'>
        {
        soundBankRef.current?.length>0 && soundBankRef.current.map((track) => {
          return renderPads(track)
        })
        }
    </div>
    </div>
  )
}

export default App
