import React, { useRef, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import * as cocoSSD from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";
import logo from "./logo.svg";
import "./App.css";

const App = () => {
  const [records, setRecords] = useState([]);

  const videoElement = useRef(null);
  const startButtonElement = useRef(null);
  const stopButtonElement = useRef(null);

  const shouldRecordRef = useRef(false);
  const isRecordingRef = useRef(false);

  useEffect(() => {
    async function prepare() {
      startButtonElement.current.setAttribute("disabled", true);
      stopButtonElement.current.setAttribute("disabled", true);
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
          });
          window.stream = stream;
          videoElement.current.srcObject = stream;

          startButtonElement.current.removeAttribute("disabled");
        } catch (error) {
          console.error(error);
        }
      }
    }
    prepare();
  }, []);

  async function detectFrame() {
    if (!shouldRecordRef.current) {
      stopRecording();
      return;
    }
  }

  function startRecording() {
    if (isRecordingRef.current) {
      return;
    }
    isRecordingRef.current = true;
    console.log("start recording");
  }

  function stopRecording() {
    if (!isRecordingRef.current) {
      return;
    }

    isRecordingRef.current = false;
    console.log("Stopped recording");
  }

  return (
    <div className="p-3">
      <div>
        <video autoPlay playsInline muted ref={videoElement} />
      </div>
      <div className="btn-toolbar" role="toolbar">
        <div className="btn-group mr-2" role="group">
          <button
            className="btn btn-success"
            onClick={() => {
              shouldRecordRef.current = true;
              stopButtonElement.current.removeAttribute("disabled");
              startButtonElement.current.setAttribute("disabled", true);
              detectFrame();
            }}
            ref={startButtonElement}
          >
            Start
          </button>
        </div>
        <div className="btn-group mr-2" role="group">
          <button
            className="btn btn-danger"
            onClick={() => {
              shouldRecordRef.current = false;
              startButtonElement.current.removeAttribute("disabled");
              stopButtonElement.current.setAttribute("disabled", true);
              stopRecording();
            }}
            ref={stopButtonElement}
          >
            Stop
          </button>
        </div>
      </div>
      <div className="row p-3">
        <h3>Records:</h3>
        {!records.length
          ? null
          : records.map((record) => {
              return (
                <div className="card mt-3 w-100" key={record.title}>
                  <div className="card-body">
                    <h5 className="card-title">{record.title}</h5>
                    <video controls src={record.href}></video>
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
};
export default App;
