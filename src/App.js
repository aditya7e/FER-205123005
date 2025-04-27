import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';

const emotionEmoji = {
  neutral: "😐",
  happy: "😊",
  sad: "😞",
  angry: "😡",
  fearful: "😱",
  disgusted: "🤢",
  surprised: "😲"
};

export default function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [expressions, setExpressions] = useState('');
  const [emotionEmojiState, setEmotionEmojiState] = useState('');
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js/weights/';
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
        console.log("Models loaded successfully");
      } catch (error) {
        console.error('Error loading models:', error);
      }
    };

    loadModels();
  }, []);

  useEffect(() => {
    const handleVideoPlay = () => {
      const interval = setInterval(async () => {
        if (videoRef.current && canvasRef.current) {
          const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();
          canvasRef.current.innerHTML = faceapi.createCanvasFromMedia(videoRef.current);
          faceapi.matchDimensions(canvasRef.current, {
            width: videoRef.current.width,
            height: videoRef.current.height
          });

          const resized = faceapi.resizeResults(detections, {
            width: videoRef.current.width,
            height: videoRef.current.height
          });

          faceapi.draw.drawDetections(canvasRef.current, resized);
          faceapi.draw.drawFaceExpressions(canvasRef.current, resized);

          resized.forEach(detection => {
            const { x, y, width, height } = detection.detection.box;
            const drawBox = new faceapi.draw.DrawBox(
              { x, y, width, height }, 
              { label: 'Face', lineWidth: 4, color: '#4CAF50', boxColor: '#4CAF50', backgroundColor: 'rgba(0, 0, 0, 0.3)' }
            );
            drawBox.draw(canvasRef.current);
          });

          if (detections.length > 0) {
            const expr = detections[0].expressions;
            const sorted = Object.entries(expr).sort((a, b) => b[1] - a[1]);
            const topExpression = sorted[0][0];

            setExpressions(topExpression);
            setEmotionEmojiState(emotionEmoji[topExpression] || "😐");
          }
        }
      }, 500);

      return () => clearInterval(interval);
    };

    if (isVideoPlaying && videoRef.current) {
      videoRef.current.addEventListener('play', handleVideoPlay);
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener('play', handleVideoPlay);
      }
    };
  }, [isVideoPlaying]);

  const handleVideoToggle = () => {
    if (isVideoPlaying) {
      setIsVideoPlaying(false);
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop()); 
        videoRef.current.srcObject = null; 
        console.log("Video feed stopped");
      }
    } else {
      setIsVideoPlaying(true);
      navigator.mediaDevices.getUserMedia({ video: {} })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            console.log("Video feed started");
          }
        })
        .catch(err => {
          console.error("Error starting video feed:", err);
        });
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-black text-white">
      <header className="w-full mb-6 flex items-center justify-between bg-gray-800 text-white p-6 shadow-lg">
        <div className="flex-1 flex justify-center">
          <h1 className="text-4xl font-extrabold">Facial Expression Recognition</h1>
        </div>
        <button className="bg-yellow-500 px-6 py-3 rounded-full text-lg hover:bg-yellow-400 transition duration-300 transform hover:scale-105">
          About
        </button>
      </header>

      <div className="flex flex-col items-center w-full space-y-6">
        <div className="relative mb-6">
          <video ref={videoRef} autoPlay muted width="640" height="480" className="rounded-lg shadow-xl border-2 border-gray-300" />
          <canvas ref={canvasRef} className="absolute top-0 left-0 rounded-lg" />
        </div>

        <div className="bg-gray-800 shadow-lg rounded-lg p-6 w-full max-w-sm">
          <h3 className="text-xl font-medium mb-4">Current Expression:</h3>
          <div className="flex items-center justify-center text-4xl">
            <span>{expressions}</span> 
            <span className="ml-2 text-4xl">{emotionEmojiState}</span>
          </div>
        </div>

        <button
          className="bg-yellow-500 hover:bg-yellow-400 text-white px-6 py-3 rounded-lg transition duration-300 w-full max-w-xs"
          onClick={handleVideoToggle}
        >
          {isVideoPlaying ? 'Stop Video Feed' : 'Start Video Feed'}
        </button>
      </div>

      <footer className="bg-white text-black p-6 mt-8 w-full text-center">
        <p className="text-lg">Made by Aditya</p>
        <div className="flex justify-center space-x-6 mt-4">
        </div>
      </footer>
    </div>
  );
}
