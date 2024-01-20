import React, { useEffect, useState, useRef, useCallback } from 'react';
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';
import Webcam from 'react-webcam';
import {
  drawKeypoints,
  drawSkeleton,
  drawGoodPostureHeight,
  drawCanvas,
} from './modules/draw_utils';
import './Options.css';
interface IDevice {
  deviceId: string;
  label: string;
}
const Options = () => {
  // Reference for baseline eye position with good posture
  let GOOD_POSTURE_POSITION = useRef<any>(null);

  // Reference for current eye position
  let currentPosturePosition = useRef<any>(null);

  // Reference for good posture deviation
  let GOOD_POSTURE_DEVIATION = useRef(25);
  const DETECTION_RATE = 100; // Rate at which pose detection is performed in ms

  // Reference for the current MoveNet model object
  let detector: any | null = null;

  // Refs for webcam and canvas
  const camRef = useRef<any>(null);
  const canvasRef = useRef<any>(null);

  // State for pose detection status
  const [isWatching, setIsWatching] = useState(false);
  const IS_PANEL_OPEN = true;

  // State for webcam device selection
  const [deviceId, setDeviceId] = useState('');
  const [devices, setDevices] = useState([]);

  let portRef = useRef<any>(null);

  // State for info popup
  const [isOverlayShowing, setIsOverlayShowing] = useState(false);

  // Handler for info popup click
  const handleOverlayClick = () => {
    setIsOverlayShowing(true);
  }

  /**
   * Starts the pose detection by loading the model and kicking off the detection loop
   */
  const loadMoveNet = async () => {
    const detectorConfig = {
      modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
    };
    detector = await poseDetection.createDetector(
      poseDetection.SupportedModels.MoveNet,
      detectorConfig
    );

    // Loop the pose detection
    setInterval(() => {
      return detect(detector);
    }, DETECTION_RATE);
  };

  /**
   * Detects the pose of the user's face,
   * then dispatches a message to the content script
   * in 'handlePose' and draws the keypoints and skeleton in 'drawCanvas'
   */
  const detect = async (model: { estimatePoses: (arg0: any) => any }) => {
    if (
      typeof camRef.current !== 'undefined' &&
      camRef.current !== null &&
      camRef.current.video.readyState === 4
    ) {
      const video = camRef.current.video;
      const videoWidth = camRef.current.video.videoWidth;
      const videoHeight = camRef.current.video.videoHeight;

      camRef.current.video.width = videoWidth;
      camRef.current.video.height = videoHeight;

      const poses = await model.estimatePoses(video);

      if (
        !poses ||
        !poses[0] ||
        !poses[0].keypoints ||
        poses[0].keypoints.length < 3
      )
        return;

      handlePose(poses);
      drawCanvas(
        poses,
        video,
        videoWidth,
        videoHeight,
        canvasRef,
        GOOD_POSTURE_POSITION.current
      );
    }
  };

  /**
   * Determines position of eye and checks against baseline posture
   */
  const handlePose = async (poses: { keypoints: { y: number }[] }[]) => {
    try {
      let rightEyePosition = poses[0].keypoints[2].y;
      currentPosturePosition.current = rightEyePosition;

      if (!rightEyePosition) return;
      if (GOOD_POSTURE_POSITION.current == null) {
        handlePosture({ baseline: currentPosturePosition.current });
      }

      if (
        Math.abs(
          currentPosturePosition.current - GOOD_POSTURE_POSITION.current
        ) > GOOD_POSTURE_DEVIATION.current
      ) {
        handlePosture({ posture: 'bad' });
      }

      if (
        Math.abs(
          currentPosturePosition.current - GOOD_POSTURE_POSITION.current
        ) < GOOD_POSTURE_DEVIATION.current
      ) {
        handlePosture({ posture: 'good' });
      }
    } catch (error) {
      console.error(error);
    }
  };

  /**
   * Passes the message to the content script
   */
  function handlePosture(msg: { baseline?: any; posture?: any }) {
    if (msg.baseline) GOOD_POSTURE_POSITION.current = msg.baseline;
    if (msg.posture) {
      portRef.current.postMessage(msg);
    }
  }

  // Event handlers for the two buttons on the options page
  const handleToggleCamera = () => {
    setIsWatching((isCurrentlyWatching) => {
      if (!isCurrentlyWatching) {
        chrome.browserAction.setBadgeText({ text: 'ON' });
        document.title = 'TRACKING POSTURE - ErgoProAI';
      } else {
        chrome.browserAction.setBadgeText({ text: 'OFF' });
        document.title = 'ErgoProAI - Options';
      }

      return !isCurrentlyWatching;
    });
  };

  const handleResetPosture = () => {
    GOOD_POSTURE_POSITION.current = null;
  };

  // Handler for media devices loaded
  const handleDevices = useCallback(
    (mediaDevices) => {
      const cameras = mediaDevices.filter(
        (device: { kind: string }) => device.kind === 'videoinput'
      );

      if (!cameras.length) return;
      setDevices(cameras);
      setDeviceId(cameras[0].deviceId);
    },
    [setDevices]
  );

  // Handler for switching between cameras
  async function handleSetDeviceId(e: any) {
    await setDeviceId(e.target.value);
    await setIsWatching(false);
    await setIsWatching((isWatching) => !isWatching);
  }

  // Connect and reconnect to ports when watching is toggled
  useEffect(() => {
    chrome.runtime.onConnect.addListener(function (port) {
      if (port.name === 'set-options') {
        port.postMessage({
          action: 'SET_IS_WATCHING',
          payload: { isWatching },
        });
        port.postMessage({
          action: 'SET_IS_PANEL_OPEN',
          payload: { isPanelOpen: IS_PANEL_OPEN },
        });

        port.onMessage.addListener(async function (msg) {
          if (msg.action === 'SET_GOOD_POSTURE_DEVIATION') {
            if (!msg.payload.GOOD_POSTURE_DEVIATION) return;
            GOOD_POSTURE_DEVIATION.current = msg.payload.GOOD_POSTURE_DEVIATION;
          }

          if (msg.action === 'RESET_POSTURE') {
            GOOD_POSTURE_POSITION.current = null;
          }
          if (msg.action === 'TOGGLE_WATCHING') {
            if (msg.payload.isWatching === null) return;
            setIsWatching(msg.payload.isWatching);
            chrome.browserAction.setBadgeText({
              text: msg.payload.isWatching ? 'ON' : 'OFF',
            });
          }
        });
        port.onDisconnect.addListener((event) => {
          // Handle port disconnection
        });
      }
    });
  }, [isWatching]);

  // Kick off the model loading and pose detection
  useEffect(() => {
    loadMoveNet();
    portRef.current = chrome.runtime.connect({ name: 'relay-detection' });
  }, []);

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(handleDevices);
  }, [handleDevices]);

  return (
    <>
      <div className="App">
        <div className="container">
          <div className="camera-container">
            {!isWatching && 'Start Camera'}
            {isWatching && (
              <>
                <Webcam
                  audio={false}
                  ref={camRef}
                  videoConstraints={{ deviceId: deviceId }}
                />
                <canvas ref={canvasRef} />
              </>
            )}
          </div>
          <div className="card options-container">
            <h1>ErgoPro AI</h1>
            <div className="button-container">
              <div>
                <button
                  className={`${isWatching ? 'btn-stop' : 'btn-start'}`}
                  onClick={handleToggleCamera}
                >
                  {!isWatching ? 'Start' : 'Stop'}
                </button>
                <p>Toggle the posture tracking</p>
              </div>
              {isWatching && (
                <div>
                  <button onClick={handleResetPosture}>Reset Posture</button>
                  <p>Reset the "Good Posture" position</p>
                </div>
              )}
            </div>
            <div className="select-container">
              <select
                onChange={handleSetDeviceId}
                value={deviceId}
                style={{
                  alignSelf: 'center',
                }}
              >
                {devices.map((device: IDevice, key) => (
                  <option value={device.deviceId} key={key}>
                    {device.label || `Device ${key + 1}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="info-container">
              <button className="btn-info" onClick={handleOverlayClick}>
                Info
              </button>
            </div>
            {/* Overlay */}
            {isOverlayShowing &&
              <div className="overlay">
                <h3>ErgoProAI</h3>
                <p>Made with Love by Team Neural Nexus at Synchronicity</p>
                <p>version {chrome.runtime.getManifest().version}</p>
                <button className="overlay-close-btn" onClick={() => setIsOverlayShowing(false)}>X</button>
              </div>
            }
          </div>
        </div>
      </div>
    </>
  );
};

export default Options;
