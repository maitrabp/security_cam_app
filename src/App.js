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
  const modelRef = useRef(null);
  const lastDetectionRef = useRef([]);
  const recorderRef = useRef(null);
  const shouldRecordRef = useRef(false);
  const isRecordingRef = useRef(false);

  //when the page renders, you wanna do this
  useEffect(() => {
    async function prepare() {
      startButtonElement.current.setAttribute("disabled", true);
      stopButtonElement.current.setAttribute("disabled", true);
      //If camera detected, then
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        //get the cam, make sure audio and video are enabled
        try {
          //on iphones it defaults to front camera, to change it google
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
          });
          //put the stream on our window stream
          window.stream = stream;
          videoElement.current.srcObject = stream;

          //TODO LOAD THE MODEL FROM COCO & assign
          const model = await cocoSSD.load();
          modelRef.current = model;

          //starts so not disabeld
          startButtonElement.current.removeAttribute("disabled");
        } catch (error) {
          console.error(error);
        }
      }
    }
    prepare();
  }, []);

  async function detectFrame() {
    //when should recordref value changes to false, we wanna stop recording (because frame runs recursively)
    if (!shouldRecordRef.current) {
      stopRecording();
      return;
    }

    //Predictions will be of the objects detected within our frame
    const predictions = await modelRef.current.detect(videoElement.current);
    let foundperson = false;

    for (let i = 0; i < predictions.length; i++) {
      if (predictions[i].class == "person") {
        console.log(JSON.stringify(predictions[i]));
        foundperson = true;
      }
    }

    if (foundperson) {
      startRecording();
      lastDetectionRef.current.push(true);
    } else if (lastDetectionRef.current.filter(Boolean).length) { //cont.. recording because there was one true before, maybe we lost couple frame so we do not detect a person.
      startRecording();
      lastDetectionRef.current.push(false)
    }
    else { //no objs within last ten frames stop recording
      stopRecording();
    }

    //leave ten most recent frames
    lastDetectionRef.current = lastDetectionRef.current.slice(
      Math.max(lastDetectionRef.current.length - 10, 0)
    )
    requestAnimationFrame(() => {
      detectFrame();
    });
  }

  function startRecording() {
    //If already started recording, then get out of this func
    if (isRecordingRef.current) {
      return;
    }
    //else start
    isRecordingRef.current = true;
    console.log("start recording");

    recorderRef.current = new MediaRecorder(window.stream);

    recorderRef.current.ondataavailable = function (e) {
      const title = new Date() + "";
      const href = URL.createObjectURL(e.data);
      setRecords(previousRecords => {
        return [...previousRecords, { href, title }];
      });
    };
    recorderRef.current.start();
  };

  function stopRecording() {
    //If already stopped recording, then get out of this func
    if (!isRecordingRef.current) {
      return;
    }
    //else stop
    isRecordingRef.current = false;
    recorderRef.current.stop();
    console.log("Stopped recording");
    lastDetectionRef.current = []
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
ReactDOM.render(<App />, document.getElementById("root"));
