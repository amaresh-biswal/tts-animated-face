import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import "./App.css";

const socket = io("http://localhost:5000");

function App() {
  const [text, setText] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [animation, setAnimation] = useState("neutral"); // Default state
  const audioRef = useRef(null);
  const idleIntervalRef = useRef(null); // Ref to manage idle state changes

  useEffect(() => {
    // Alternate between "neutral" and "thinking" when idle
    idleIntervalRef.current = setInterval(() => {
      setAnimation((prev) => (prev === "neutral" ? "thinking" : "neutral"));
    }, 3000); // Alternate every 3 seconds

    return () => {
      clearInterval(idleIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    socket.on("audio", (url) => {
      console.log("Received audio URL:", url);
      setAudioUrl(url);
      clearInterval(idleIntervalRef.current); // Stop idle state changes

      // Set the animation to "Computing" first
      setAnimation("computing");

      // Delay the start of the "speaking" animation slightly
      setTimeout(() => {
        setAnimation("speaking");
      }, 1500); // 1.5 second delay before starting "speaking"
    });

    return () => {
      socket.off("audio");
      clearInterval(idleIntervalRef.current); // Cleanup idle timer on unmount
    };
  }, []);

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      console.log("Audio URL:", audioUrl);
      audioRef.current.load();
      audioRef.current
        .play()
        .then(() => {
          console.log("Audio playback started");
        })
        .catch((error) => {
          console.error("Error playing audio:", error);
        });
    }
  }, [audioUrl]);

  // Handle audio finishing to reset the "speaking" state
  useEffect(() => {
    const audioElement = audioRef.current;

    if (audioElement) {
      // Event listener for when the audio ends
      audioElement.onended = () => {
        console.log("Audio finished playing");
        setAnimation("neutral"); // Reset to "neutral" after the audio finishes
        // Resume idle state changes after audio ends
        idleIntervalRef.current = setInterval(() => {
          setAnimation((prev) => (prev === "neutral" ? "thinking" : "neutral"));
        }, 3000);
      };
    }

    return () => {
      if (audioElement) {
        audioElement.onended = null; // Cleanup on component unmount
      }
    };
  }, [audioUrl]);

  const handleSpeak = () => {
    socket.emit("speak", text); // Emit 'speak' event with the input text
    setAnimation("computing"); // Show "computing" state while waiting for audio
  };

  const handleTextInput = (e) => {
    setText(e.target.value);
    if (e.target.value) {
      clearInterval(idleIntervalRef.current); // Stop idle state changes
      setAnimation("listening"); // Set animation to "listening" when typing
    } else {
      // Resume idle animation when input is cleared
      idleIntervalRef.current = setInterval(() => {
        setAnimation((prev) => (prev === "neutral" ? "thinking" : "neutral"));
      }, 3000);
    }
  };

  return (
    <div className="App">
      <h1 style={{ textAlign: "center" }}>Text-to-Speech with Animated Face</h1>
      <div style={{ textAlign: "center" }}>
        <textarea value={text} onChange={handleTextInput} />
        <button onClick={handleSpeak}>Speak</button>
        <br />
        <audio ref={audioRef} src={audioUrl} type="audio/mpeg" controls />
      </div>
      <div id="container">
        <div id="bot" className={animation}>
          <div id="head">
            <div id="left-ear">
              <div id="left-ear-inner"></div>
            </div>
            <div id="face">
              <div id="eyes">
                <div id="left-eye"></div>
                <div id="right-eye"></div>
              </div>
              <div id="mouth"></div>
            </div>
            <div id="right-ear">
              <div id="right-ear-inner"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
