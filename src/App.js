import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:5000');

function App() {
  const [text, setText] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [animation, setAnimation] = useState('');
  const audioRef = useRef(null);

  useEffect(() => {
    socket.on('audio', (url) => {
      console.log('Received audio URL:', url);
      setAudioUrl(url);
      setAnimation('speaking');
    });

    socket.on('done', () => {
      setAnimation('');
    });

    return () => {
      socket.off('audio');
      socket.off('done');
    };
  }, []);

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      console.log('Audio URL:', audioUrl); // Log the URL
      audioRef.current.load();
      audioRef.current.play()
        .then(() => {
          console.log('Audio playback started');
        })
        .catch((error) => {
          console.error('Error playing audio:', error);
        });
    }
  }, [audioUrl]);

  const handleSpeak = () => {
    socket.emit('speak', text);
  };

  return (
    <div className="App">
      <h1>Text-to-Speech with Animated Face</h1>
      <textarea value={text} onChange={(e) => setText(e.target.value)} />
      <button onClick={handleSpeak}>Speak</button>
      <audio ref={audioRef} src={audioUrl} type="audio/mpeg" controls />
      <div className={`face ${animation}`}>
        <div className="eye left"></div>
        <div className="eye right"></div>
        <div className="mouth"></div>
      </div>
    </div>
  );
}

export default App;
