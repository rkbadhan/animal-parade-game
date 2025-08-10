import React, { useState, useEffect, useRef } from 'react';

const AnimalParadeCounter = () => {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [gameState, setGameState] = useState('instruction');
  const [selectedAnimals, setSelectedAnimals] = useState([]);
  const [bridgeLights, setBridgeLights] = useState([]);
  const [animalGrid, setAnimalGrid] = useState([]);
  const [targetAnimal, setTargetAnimal] = useState(null);
  const [targetCount, setTargetCount] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState([]);
  const [tryingToSelectMore, setTryingToSelectMore] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [volume, setVolume] = useState(0.7);

  const animals = [
    { emoji: '🐘', name: 'Elephant', sound: 'Trumpet!' },
    { emoji: '🦁', name: 'Lion', sound: 'Roar!' },
    { emoji: '🐸', name: 'Frog', sound: 'Ribbit!' },
    { emoji: '🐮', name: 'Cow', sound: 'Moo!' },
    { emoji: '🐷', name: 'Pig', sound: 'Oink!' },
    { emoji: '🐨', name: 'Koala', sound: 'G\'day!' },
    { emoji: '🐻', name: 'Bear', sound: 'Growl!' },
    { emoji: '🐯', name: 'Tiger', sound: 'Rawr!' },
    { emoji: '🐰', name: 'Bunny', sound: 'Hop!' },
    { emoji: '🐼', name: 'Panda', sound: 'Bamboo!' }
  ];

  const countdownRef = useRef(null);

  useEffect(() => {
    generateChallenge();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLevel]);

  // Auto-progression countdown
  useEffect(() => {
    if (countdown > 0) {
      countdownRef.current = setTimeout(() => {
        setCountdown(countdown - 1);
        if (audioEnabled) {
          playSound(`${countdown - 1}`);
        }
      }, 1000);
    } else if (countdown === 0 && gameState === 'countdown') {
      setCurrentLevel(prev => prev + 1);
      if (audioEnabled) {
        speak('GO!');
      }
    }
    
    return () => {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
      }
    };
  }, [countdown, gameState, audioEnabled]);

  const speak = (text, rate = 1) => {
    if (!audioEnabled || !window.speechSynthesis) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = volume;
    utterance.rate = rate;
    utterance.pitch = 1.2; // Slightly higher pitch for children
    
    // Try to use a child-friendly voice if available
    const voices = window.speechSynthesis.getVoices();
    const childVoice = voices.find(voice => 
      voice.name.includes('child') || 
      voice.name.includes('kid') ||
      voice.gender === 'female'
    );
    if (childVoice) {
      utterance.voice = childVoice;
    }
    
    window.speechSynthesis.speak(utterance);
  };

  const playSound = (type) => {
    if (!audioEnabled) return;
    
    // Create different tones for different actions
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    gainNode.gain.setValueAtTime(volume * 0.3, audioContext.currentTime);
    
    switch(type) {
      case 'correct':
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        break;
      case 'wrong':
        oscillator.frequency.setValueAtTime(196.00, audioContext.currentTime); // G3
        break;
      case 'celebration':
        // Play a quick ascending melody
        oscillator.frequency.setValueAtTime(261.63, audioContext.currentTime); // C4
        oscillator.frequency.setValueAtTime(329.63, audioContext.currentTime + 0.1); // E4
        oscillator.frequency.setValueAtTime(392.00, audioContext.currentTime + 0.2); // G4
        break;
      default:
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
    }
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  const getProgressivePraise = () => {
    if (currentLevel <= 2) {
      return ['Good job!', 'Nice work!', 'Well done!'][Math.floor(Math.random() * 3)];
    } else if (currentLevel <= 4) {
      return ['Excellent!', 'Fantastic!', 'Wonderful!'][Math.floor(Math.random() * 3)];
    } else {
      return ['Amazing!', 'Incredible!', 'You\'re a superstar!', 'Outstanding!'][Math.floor(Math.random() * 4)];
    }
  };

  const generateChallenge = () => {
    const baseTargetCount = Math.min(2 + Math.floor(currentLevel / 2), 6);
    const totalAnimals = Math.min(12 + currentLevel * 2, 24);
    const animalTypes = Math.min(3 + Math.floor(currentLevel / 3), 6);
    
    const selectedTypes = animals.slice(0, animalTypes);
    const target = selectedTypes[Math.floor(Math.random() * selectedTypes.length)];
    
    const grid = [];
    const actualTargetAnimals = baseTargetCount + Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < actualTargetAnimals; i++) {
      grid.push({ ...target, id: `target-${i}`, isTarget: true });
    }
    
    for (let i = 0; i < totalAnimals - actualTargetAnimals; i++) {
      const otherTypes = selectedTypes.filter(a => a.emoji !== target.emoji);
      const randomAnimal = otherTypes[Math.floor(Math.random() * otherTypes.length)];
      grid.push({ ...randomAnimal, id: `other-${i}`, isTarget: false });
    }
    
    for (let i = grid.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [grid[i], grid[j]] = [grid[j], grid[i]];
    }
    
    setAnimalGrid(grid);
    setTargetAnimal(target);
    setTargetCount(baseTargetCount);
    setSelectedAnimals([]);
    setBridgeLights([]);
    setWrongAttempts([]);
    setTryingToSelectMore(false);
    setGameState('instruction');
  };

  const startCounting = () => {
    setGameState('counting');
    if (audioEnabled) {
      speak(`Find ${targetCount} ${targetAnimal.name}s!`);
    }
  };

  const clickAnimal = (clickedAnimal, index) => {
    if (gameState !== 'counting') return;
    
    if (selectedAnimals.includes(index)) return;
    
    if (selectedAnimals.length >= targetCount) {
      setTryingToSelectMore(true);
      showSoundEffect(index, 'Stop! You have enough!');
      if (audioEnabled) {
        speak('Stop! You have enough!');
        playSound('wrong');
      }
      setTimeout(() => setTryingToSelectMore(false), 2000);
      return;
    }
    
    if (clickedAnimal.isTarget) {
      const newSelected = [...selectedAnimals, index];
      setSelectedAnimals(newSelected);
      
      const newLights = [...bridgeLights, index];
      setBridgeLights(newLights);
      
      showSoundEffect(index, `${clickedAnimal.sound} #${newSelected.length}`);
      
      if (audioEnabled) {
        playSound('correct');
        speak(`${newSelected.length}`);
      }
      
      if (newSelected.length === targetCount) {
        setTimeout(() => {
          setGameState('celebrating');
          if (audioEnabled) {
            playSound('celebration');
            setTimeout(() => {
              speak(getProgressivePraise());
            }, 500);
          }
          
          // Start auto-progression countdown
          setTimeout(() => {
            setCountdown(3);
            setGameState('countdown');
          }, 2000);
        }, 500);
      }
    } else {
      setWrongAttempts(prev => [...prev, index]);
      showSoundEffect(index, `No! Find ${targetAnimal.name}s!`);
      
      if (audioEnabled) {
        playSound('wrong');
        speak(`No! Find ${targetAnimal.name}s!`);
      }
      
      setTimeout(() => {
        setWrongAttempts(prev => prev.filter(i => i !== index));
      }, 1500);
    }
  };

  const showSoundEffect = (index, sound) => {
    const soundElement = document.getElementById(`sound-${index}`);
    if (soundElement) {
      soundElement.textContent = sound;
      soundElement.style.display = 'block';
      setTimeout(() => {
        if (soundElement) soundElement.style.display = 'none';
      }, 1500);
    }
  };

  const restartLevel = () => {
    generateChallenge();
  };

  const getDifficultyText = () => {
    if (currentLevel <= 2) return "Beginner";
    if (currentLevel <= 4) return "Easy";
    if (currentLevel <= 6) return "Medium";
    return "Advanced";
  };

  const targetAnimalsAvailable = animalGrid.filter(animal => animal.isTarget).length;

  return (
    <div className="game-container">
      {/* Audio Controls */}
      <div className="audio-controls">
        <button
          onClick={() => setAudioEnabled(!audioEnabled)}
          className={`audio-btn ${audioEnabled ? 'audio-on' : 'audio-off'}`}
        >
          {audioEnabled ? '🔊' : '🔇'}
        </button>
        {audioEnabled && (
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="volume-slider"
          />
        )}
      </div>

      <div className="game-content">
        {/* Header */}
        <div className="game-header">
          <h1 className="game-title">Animal Selection Challenge</h1>
          <div className="level-info">
            Level {currentLevel} - {getDifficultyText()}
          </div>
        </div>

        {/* Countdown Display */}
        {gameState === 'countdown' && (
          <div className="countdown-display">
            <div className="countdown-number">{countdown}</div>
            <div className="countdown-text">Next level starting...</div>
          </div>
        )}

        {/* Challenge Instructions */}
        {gameState === 'instruction' && targetAnimal && (
          <div className="instruction-card">
            <div className="target-emoji">{targetAnimal.emoji}</div>
            <div className="challenge-title">
              Select {targetCount} {targetAnimal.name}s
            </div>
            <div className="challenge-subtitle">
              Choose exactly {targetCount} {targetAnimal.name}s and stop!
            </div>
            <div className="challenge-info">
              There are {targetAnimalsAvailable} {targetAnimal.name}s available, but you only need {targetCount}
            </div>
            <button
              onClick={startCounting}
              className="start-btn"
            >
              Start Selecting!
            </button>
          </div>
        )}

        {/* Game Area */}
        <div className="game-area">
          
          {/* Progress Display */}
          {gameState === 'counting' && targetAnimal && (
            <div className="progress-display">
              <div className="progress-title">
                Select {targetCount} {targetAnimal.emoji} {targetAnimal.name}s
              </div>
              <div className="progress-counter">
                Selected: <span className="selected-count">{selectedAnimals.length}</span> / {targetCount}
              </div>
              {selectedAnimals.length < targetCount && (
                <div className="progress-remaining">
                  You need {targetCount - selectedAnimals.length} more {targetAnimal.name}{targetCount - selectedAnimals.length !== 1 ? 's' : ''}
                </div>
              )}
              {tryingToSelectMore && (
                <div className="warning-message">
                  Stop! You already have {targetCount} {targetAnimal.name}s!
                </div>
              )}
            </div>
          )}

          {/* Bridge */}
          <div className="bridge-container">
            <div className="bridge">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="bridge-plank" style={{ left: `${i * 8}%` }} />
              ))}
              
              {bridgeLights.map((lightIndex, i) => (
                <div 
                  key={i}
                  className="bridge-light"
                  style={{ left: `${10 + (i * 70 / targetCount)}%` }}
                >
                  {i + 1}
                </div>
              ))}
              
              <div className="water">
                <div className="water-surface" />
              </div>
            </div>
          </div>

          {/* Animal Grid */}
          {gameState !== 'instruction' && gameState !== 'countdown' && (
            <div className="animal-grid">
              {animalGrid.map((animal, index) => (
                <div key={index} className="animal-container">
                  <button
                    onClick={() => clickAnimal(animal, index)}
                    disabled={gameState !== 'counting'}
                    className={`animal-btn ${
                      selectedAnimals.includes(index) ? 'selected' :
                      wrongAttempts.includes(index) ? 'wrong' :
                      animal.isTarget && gameState === 'counting' && selectedAnimals.length < targetCount ? 'target-available' :
                      animal.isTarget && selectedAnimals.length >= targetCount ? 'target-disabled' :
                      'other'
                    }`}
                  >
                    {animal.emoji}
                    
                    {selectedAnimals.includes(index) && (
                      <div className="selection-number">
                        {selectedAnimals.indexOf(index) + 1}
                      </div>
                    )}
                    
                    {wrongAttempts.includes(index) && (
                      <div className="wrong-indicator">✗</div>
                    )}
                  </button>
                  
                  <div 
                    id={`sound-${index}`}
                    className="sound-bubble"
                    style={{ display: 'none' }}
                  >
                    <div className="bubble-arrow"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Game Status */}
          <div className="status-area">
            {gameState === 'celebrating' && (
              <div className="celebration">
                <div className="celebration-emoji">🎉</div>
                <div className="celebration-title">Perfect! Exactly {targetCount}!</div>
                <div className="celebration-message">
                  You selected exactly {targetCount} {targetAnimal.name}s and stopped at the right number!
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="instructions">
          <h3 className="instructions-title">How to Play:</h3>
          <p className="instructions-text">
            1. Read the challenge: "Select X Tigers" • 2. Find and tap exactly that many tigers • 3. Stop when you reach the target number • 4. Don't select more than needed!
          </p>
        </div>

        {/* Progress Info */}
        <div className="progress-info">
          Challenge: Select {targetCount} out of {targetAnimalsAvailable} available {targetAnimal?.name}s • Level {currentLevel}
        </div>
      </div>

      <style jsx>{`
        .game-container {
          min-height: 100vh;
          background: linear-gradient(to bottom, #bfdbfe, #bbf7d0);
          padding: clamp(0.5rem, 2vw, 1rem);
          position: relative;
        }

        .audio-controls {
          position: fixed;
          top: clamp(0.5rem, 2vw, 1rem);
          right: clamp(0.5rem, 2vw, 1rem);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          z-index: 1000;
        }

        .audio-btn {
          width: clamp(40px, 8vw, 60px);
          height: clamp(40px, 8vw, 60px);
          border-radius: 50%;
          border: none;
          font-size: clamp(1.2rem, 4vw, 1.8rem);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .audio-on {
          background: #10b981;
          color: white;
        }

        .audio-off {
          background: #ef4444;
          color: white;
        }

        .volume-slider {
          width: clamp(60px, 15vw, 100px);
          height: clamp(20px, 4vw, 30px);
        }

        .game-content {
          max-width: min(100vw, 1200px);
          margin: 0 auto;
        }

        .game-header {
          text-align: center;
          margin-bottom: clamp(1rem, 4vw, 2rem);
        }

        .game-title {
          font-size: clamp(1.5rem, 6vw, 3rem);
          font-weight: bold;
          color: #7c3aed;
          margin-bottom: clamp(0.25rem, 1vw, 0.5rem);
        }

        .level-info {
          font-size: clamp(0.9rem, 3vw, 1.5rem);
          font-weight: 600;
          color: #1d4ed8;
        }

        .countdown-display {
          text-align: center;
          margin-bottom: clamp(1rem, 4vw, 2rem);
          background: #fef3c7;
          border-radius: clamp(1rem, 4vw, 2rem);
          padding: clamp(1rem, 4vw, 2rem);
          border: 4px solid #f59e0b;
        }

        .countdown-number {
          font-size: clamp(3rem, 15vw, 8rem);
          font-weight: bold;
          color: #7c3aed;
          animation: bounce 1s infinite;
        }

        .countdown-text {
          font-size: clamp(1rem, 4vw, 1.5rem);
          color: #7c3aed;
          margin-top: 0.5rem;
        }

        .instruction-card {
          text-align: center;
          margin-bottom: clamp(1rem, 4vw, 2rem);
          background: #fef3c7;
          border-radius: clamp(1rem, 4vw, 2rem);
          padding: clamp(1rem, 4vw, 2rem);
          border: 4px solid #f59e0b;
        }

        .target-emoji {
          font-size: clamp(3rem, 15vw, 8rem);
          margin-bottom: clamp(0.5rem, 2vw, 1rem);
        }

        .challenge-title {
          font-size: clamp(1.5rem, 6vw, 3rem);
          font-weight: bold;
          color: #7c3aed;
          margin-bottom: clamp(0.25rem, 1vw, 0.5rem);
        }

        .challenge-subtitle {
          font-size: clamp(1rem, 4vw, 1.5rem);
          color: #7c2d12;
          margin-bottom: clamp(0.25rem, 1vw, 0.5rem);
        }

        .challenge-info {
          font-size: clamp(0.8rem, 3vw, 1.2rem);
          color: #1d4ed8;
          margin-bottom: clamp(0.5rem, 2vw, 1rem);
        }

        .start-btn {
          background: #10b981;
          color: white;
          font-size: clamp(1rem, 4vw, 1.5rem);
          font-weight: bold;
          padding: clamp(0.75rem, 3vw, 1rem) clamp(1.5rem, 6vw, 2rem);
          border-radius: 9999px;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          min-height: 44px;
        }

        .start-btn:active {
          transform: scale(0.95);
        }

        .game-area {
          background: white;
          border-radius: clamp(1rem, 4vw, 2rem);
          padding: clamp(1rem, 4vw, 2rem);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          margin-bottom: clamp(1rem, 4vw, 2rem);
        }

        .progress-display {
          text-align: center;
          margin-bottom: clamp(0.5rem, 2vw, 1rem);
          background: #f3f4f6;
          border-radius: clamp(0.5rem, 2vw, 1rem);
          padding: clamp(0.5rem, 2vw, 1rem);
        }

        .progress-title {
          font-size: clamp(1.2rem, 5vw, 2rem);
          font-weight: bold;
          color: #7c3aed;
          margin-bottom: clamp(0.25rem, 1vw, 0.5rem);
        }

        .progress-counter {
          font-size: clamp(1rem, 4vw, 1.5rem);
          color: #7c2d12;
          margin-bottom: clamp(0.25rem, 1vw, 0.5rem);
        }

        .selected-count {
          color: #10b981;
          font-weight: bold;
          font-size: clamp(1.2rem, 5vw, 2rem);
        }

        .progress-remaining {
          font-size: clamp(0.9rem, 3vw, 1.2rem);
          color: #1d4ed8;
        }

        .warning-message {
          font-size: clamp(1rem, 4vw, 1.5rem);
          color: #ef4444;
          font-weight: bold;
          animation: pulse 2s infinite;
        }

        .bridge-container {
          position: relative;
          margin-bottom: clamp(1rem, 4vw, 2rem);
        }

        .bridge {
          height: clamp(60px, 12vw, 96px);
          background: linear-gradient(to right, #d97706, #92400e);
          border-radius: clamp(0.25rem, 1vw, 0.5rem);
          position: relative;
        }

        .bridge-plank {
          position: absolute;
          height: 100%;
          width: clamp(8px, 2vw, 12px);
          background: #451a03;
          opacity: 0.3;
        }

        .bridge-light {
          position: absolute;
          top: clamp(4px, 1vw, 8px);
          width: clamp(24px, 5vw, 32px);
          height: clamp(24px, 5vw, 32px);
          background: #fbbf24;
          border-radius: 50%;
          animation: pulse 2s infinite;
          border: 2px solid #d97706;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #7c3aed;
          font-weight: bold;
          font-size: clamp(0.8rem, 3vw, 1rem);
        }

        .water {
          position: absolute;
          bottom: clamp(-12px, -2vw, -16px);
          left: 0;
          right: 0;
          height: clamp(24px, 5vw, 32px);
          background: #3b82f6;
          border-radius: 0 0 clamp(0.25rem, 1vw, 0.5rem) clamp(0.25rem, 1vw, 0.5rem);
        }

        .water-surface {
          height: 100%;
          background: linear-gradient(to right, #3b82f6, #1d4ed8);
          border-radius: 0 0 clamp(0.25rem, 1vw, 0.5rem) clamp(0.25rem, 1vw, 0.5rem);
          animation: pulse 3s infinite;
        }

        .animal-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(clamp(70px, 15vw, 120px), 1fr));
          gap: clamp(0.5rem, 2vw, 1rem);
          margin-bottom: clamp(1rem, 4vw, 2rem);
          justify-items: center;
        }

        .animal-container {
          position: relative;
        }

        .animal-btn {
          position: relative;
          font-size: clamp(2rem, 8vw, 4rem);
          padding: clamp(0.5rem, 2vw, 1rem);
          border-radius: clamp(0.75rem, 3vw, 1rem);
          border: 4px solid;
          transition: all 0.3s ease;
          width: clamp(70px, 15vw, 120px);
          height: clamp(70px, 15vw, 120px);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          min-height: 44px;
          min-width: 44px;
        }

        .selected {
          border-color: #10b981;
          background: #d1fae5;
          transform: scale(0.95);
        }

        .wrong {
          border-color: #ef4444;
          background: #fee2e2;
          animation: shake 0.5s ease-in-out;
        }

        .target-available {
          border-color: #7c3aed;
          background: #f3f4f6;
        }

        .target-available:active {
          transform: scale(1.1);
          border-color: #5b21b6;
        }

        .target-disabled {
          border-color: #9ca3af;
          background: #f3f4f6;
          opacity: 0.6;
          cursor: not-allowed;
        }

        .other {
          border-color: #3b82f6;
          background: #dbeafe;
        }

        .other:active {
          transform: scale(1.05);
        }

        .selection-number {
          position: absolute;
          top: clamp(-6px, -1vw, -8px);
          right: clamp(-6px, -1vw, -8px);
          background: #10b981;
          color: white;
          font-size: clamp(0.8rem, 3vw, 1.2rem);
          font-weight: bold;
          width: clamp(24px, 5vw, 32px);
          height: clamp(24px, 5vw, 32px);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .wrong-indicator {
          position: absolute;
          top: clamp(-6px, -1vw, -8px);
          right: clamp(-6px, -1vw, -8px);
          background: #ef4444;
          color: white;
          font-size: clamp(0.8rem, 3vw, 1.2rem);
          font-weight: bold;
          width: clamp(20px, 4vw, 24px);
          height: clamp(20px, 4vw, 24px);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sound-bubble {
          position: absolute;
          top: clamp(-48px, -10vw, -64px);
          left: 50%;
          transform: translateX(-50%);
          background: white;
          border: 2px solid #7c3aed;
          border-radius: clamp(0.25rem, 1vw, 0.5rem);
          padding: clamp(0.25rem, 1vw, 0.5rem) clamp(0.5rem, 2vw, 0.75rem);
          font-size: clamp(0.7rem, 2.5vw, 0.9rem);
          font-weight: bold;
          color: #7c3aed;
          z-index: 10;
          white-space: nowrap;
        }

        .bubble-arrow {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-top: 4px solid #7c3aed;
        }

        .status-area {
          text-align: center;
        }

        .celebration {
          text-align: center;
        }

        .celebration-emoji {
          font-size: clamp(3rem, 12vw, 6rem);
          margin-bottom: clamp(0.5rem, 2vw, 1rem);
          animation: bounce 2s infinite;
        }

        .celebration-title {
          font-size: clamp(1.5rem, 6vw, 3rem);
          font-weight: bold;
          color: #10b981;
          margin-bottom: clamp(0.5rem, 2vw, 1rem);
        }

        .celebration-message {
          font-size: clamp(1rem, 4vw, 1.5rem);
          color: #7c3aed;
        }

        .instructions {
          background: #f3f4f6;
          border-radius: clamp(0.75rem, 3vw, 1rem);
          padding: clamp(0.5rem, 2vw, 1rem);
          text-align: center;
          margin-bottom: clamp(0.5rem, 2vw, 1rem);
        }

        .instructions-title {
          font-size: clamp(1rem, 4vw, 1.5rem);
          font-weight: bold;
          color: #7c3aed;
          margin-bottom: clamp(0.25rem, 1vw, 0.5rem);
        }

        .instructions-text {
          color: #7c3aed;
          font-size: clamp(0.8rem, 3vw, 1rem);
        }

        .progress-info {
          text-align: center;
          font-size: clamp(0.7rem, 2.5vw, 0.9rem);
          color: #7c2d12;
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-25%);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
};

export default AnimalParadeCounter;