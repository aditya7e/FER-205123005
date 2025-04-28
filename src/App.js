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
    const startVideo = () => {
      navigator.mediaDevices.getUserMedia({ video: {} })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => console.error('Error getting video stream:', err));
    };

    const loadModels = async () => {
      const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js/weights/';
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
    };

    loadModels().then(startVideo);
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

    if (videoRef.current) {
      videoRef.current.addEventListener('play', handleVideoPlay);
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener('play', handleVideoPlay);
      }
    };
  }, []);

  const handleVideoToggle = () => {
    if (isVideoPlaying) {
      setIsVideoPlaying(false);
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    } else {
      setIsVideoPlaying(true);
      navigator.mediaDevices.getUserMedia({ video: {} }).then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      });
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 p-6">
      <header className="w-full mb-6 flex items-center justify-between bg-indigo-600 text-white p-4 rounded-lg shadow-lg">
        <h1 className="text-3xl font-semibold">Facial Expression Recognition</h1>
        <button className="bg-yellow-500 px-4 py-2 rounded-lg hover:bg-yellow-400 transition duration-300">About</button>
      </header>

      <div className="flex flex-col items-center w-full space-y-6">
        <div className="relative mb-6">
          <video ref={videoRef} autoPlay muted width="640" height="480" className="rounded-lg shadow-xl border-2 border-gray-300" />
          <canvas ref={canvasRef} className="absolute top-0 left-0 rounded-lg" />
        </div>

        <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-sm">
          <h3 className="text-xl font-medium mb-4">Current Expression:</h3>
          <div className="flex items-center justify-center text-4xl">
            <span>{expressions}</span> 
            <span className="ml-2 text-4xl">{emotionEmojiState}</span>
          </div>
        </div>

        
      </div>
    </div>
  );
}
