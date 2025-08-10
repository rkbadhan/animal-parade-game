import React, { useState, useEffect } from 'react';

const AnimalParadeCounter = () => {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [gameState, setGameState] = useState('instruction'); // instruction, counting, completed, celebrating
  const [selectedAnimals, setSelectedAnimals] = useState([]);
  const [bridgeLights, setBridgeLights] = useState([]);
  const [animalGrid, setAnimalGrid] = useState([]);
  const [targetAnimal, setTargetAnimal] = useState(null);
  const [targetCount, setTargetCount] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState([]);
  const [tryingToSelectMore, setTryingToSelectMore] = useState(false);

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

  useEffect(() => {
    generateChallenge();
  }, [currentLevel]);

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
  };

  const clickAnimal = (clickedAnimal, index) => {
    if (gameState !== 'counting') return;
    
    if (selectedAnimals.includes(index)) return;
    
    if (selectedAnimals.length >= targetCount) {
      setTryingToSelectMore(true);
      showSoundEffect(index, 'Stop! You have enough!');
      setTimeout(() => setTryingToSelectMore(false), 2000);
      return;
    }
    
    if (clickedAnimal.isTarget) {
      const newSelected = [...selectedAnimals, index];
      setSelectedAnimals(newSelected);
      
      const newLights = [...bridgeLights, index];
      setBridgeLights(newLights);
      
      showSoundEffect(index, `${clickedAnimal.sound} #${newSelected.length}`);
      
      if (newSelected.length === targetCount) {
        setTimeout(() => {
          setGameState('celebrating');
          setTimeout(() => {
            setGameState('completed');
          }, 2000);
        }, 500);
      }
    } else {
      setWrongAttempts(prev => [...prev, index]);
      showSoundEffect(index, `No! Find ${targetAnimal.name}s!`);
      
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

  const nextLevel = () => {
    setCurrentLevel(prev => prev + 1);
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
    <div className="min-h-screen bg-gradient-to-b from-blue-200 to-green-200 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-purple-800 mb-2">Animal Selection Challenge</h1>
          <div className="text-xl font-semibold text-blue-700">
            Level {currentLevel} - {getDifficultyText()}
          </div>
        </div>

        {gameState === 'instruction' && targetAnimal && (
          <div className="text-center mb-6 bg-yellow-100 rounded-3xl p-6 border-4 border-yellow-400">
            <div className="text-8xl mb-4">{targetAnimal.emoji}</div>
            <div className="text-4xl font-bold text-purple-800 mb-2">
              Select {targetCount} {targetAnimal.name}s
            </div>
            <div className="text-2xl text-purple-600 mb-2">
              Choose exactly {targetCount} {targetAnimal.name}s and stop!
            </div>
            <div className="text-lg text-blue-600 mb-4">
              There are {targetAnimalsAvailable} {targetAnimal.name}s available, but you only need {targetCount}
            </div>
            <button
              onClick={startCounting}
              className="bg-green-500 hover:bg-green-600 text-white text-2xl font-bold py-4 px-8 rounded-full transform transition-all hover:scale-105"
            >
              Start Selecting!
            </button>
          </div>
        )}

        <div className="bg-white rounded-3xl p-6 shadow-2xl mb-6">
          
          {gameState === 'counting' && targetAnimal && (
            <div className="text-center mb-4 bg-purple-100 rounded-2xl p-4">
              <div className="text-3xl font-bold text-purple-800 mb-2">
                Select {targetCount} {targetAnimal.emoji} {targetAnimal.name}s
              </div>
              <div className="text-2xl text-purple-600 mb-2">
                Selected: <span className="text-green-600 font-bold text-3xl">{selectedAnimals.length}</span> / {targetCount}
              </div>
              {selectedAnimals.length < targetCount && (
                <div className="text-lg text-blue-600">
                  You need {targetCount - selectedAnimals.length} more {targetAnimal.name}{targetCount - selectedAnimals.length !== 1 ? 's' : ''}
                </div>
              )}
              {tryingToSelectMore && (
                <div className="text-xl text-red-600 font-bold animate-pulse">
                  Stop! You already have {targetCount} {targetAnimal.name}s!
                </div>
              )}
            </div>
          )}

          <div className="relative mb-8">
            <div className="h-24 bg-gradient-to-r from-amber-600 to-amber-800 rounded-lg relative">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="absolute h-full w-3 bg-amber-900 opacity-30" 
                     style={{ left: `${i * 8}%` }} />
              ))}
              
              {bridgeLights.map((lightIndex, i) => (
                <div key={i} 
                     className="absolute top-2 w-8 h-8 bg-yellow-400 rounded-full animate-pulse border-2 border-yellow-600 flex items-center justify-center text-purple-800 font-bold"
                     style={{ left: `${10 + (i * 70 / targetCount)}%` }}>
                  {i + 1}
                </div>
              ))}
              
              <div className="absolute -bottom-4 left-0 right-0 h-8 bg-blue-400 rounded-b-lg">
                <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-b-lg animate-pulse" />
              </div>
            </div>
          </div>

          {gameState !== 'instruction' && (
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 mb-6">
              {animalGrid.map((animal, index) => (
                <div key={index} className="relative">
                  <button
                    onClick={() => clickAnimal(animal, index)}
                    disabled={gameState !== 'counting'}
                    className={`
                      relative text-4xl md:text-5xl p-3 rounded-2xl border-4 transition-all duration-300 transform w-full aspect-square flex items-center justify-center
                      ${selectedAnimals.includes(index)
                        ? 'border-green-500 bg-green-100 scale-95' 
                        : wrongAttempts.includes(index)
                          ? 'border-red-500 bg-red-100 animate-shake'
                          : animal.isTarget && gameState === 'counting' && selectedAnimals.length < targetCount
                            ? 'border-purple-400 bg-purple-50 hover:scale-110 hover:border-purple-600 cursor-pointer'
                            : animal.isTarget && selectedAnimals.length >= targetCount
                              ? 'border-gray-400 bg-gray-100 opacity-60 cursor-not-allowed'
                              : 'border-blue-400 bg-blue-50 hover:scale-105 cursor-pointer'
                      }
                    `}
                  >
                    {animal.emoji}
                    
                    {selectedAnimals.includes(index) && (
                      <div className="absolute -top-2 -right-2 bg-green-500 text-white text-lg font-bold w-8 h-8 rounded-full flex items-center justify-center">
                        {selectedAnimals.indexOf(index) + 1}
                      </div>
                    )}
                    
                    {wrongAttempts.includes(index) && (
                      <div className="absolute -top-2 -right-2 bg-red-500 text-white text-lg font-bold w-6 h-6 rounded-full flex items-center justify-center">
                        ✗
                      </div>
                    )}
                  </button>
                  
                  <div 
                    id={`sound-${index}`}
                    className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-white border-2 border-purple-400 rounded-lg px-3 py-2 text-sm font-bold text-purple-700 hidden z-10 whitespace-nowrap"
                    style={{ display: 'none' }}
                  >
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-purple-400"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center">
            {gameState === 'celebrating' && (
              <div className="text-center">
                <div className="text-6xl mb-4 animate-bounce">🎉</div>
                <div className="text-3xl font-bold text-green-600 mb-4">Perfect! Exactly {targetCount}!</div>
                <div className="text-xl text-purple-700">
                  You selected exactly {targetCount} {targetAnimal.name}s and stopped at the right number!
                </div>
              </div>
            )}

            {gameState === 'completed' && (
              <div className="space-y-4">
                <div className="text-2xl font-bold text-green-600 mb-4">
                  Amazing counting control! You're a number master!
                </div>
                <div className="space-x-4">
                  <button
                    onClick={nextLevel}
                    className="bg-blue-500 hover:bg-blue-600 text-white text-xl font-bold py-3 px-6 rounded-full transform transition-all hover:scale-105"
                  >
                    Next Challenge!
                  </button>
                  <button
                    onClick={restartLevel}
                    className="bg-purple-500 hover:bg-purple-600 text-white text-xl font-bold py-3 px-6 rounded-full transform transition-all hover:scale-105"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-purple-100 rounded-2xl p-4 text-center">
          <h3 className="text-xl font-bold text-purple-800 mb-2">How to Play:</h3>
          <p className="text-purple-700">
            1. Read the challenge: "Select X Tigers" • 2. Find and tap exactly that many tigers • 3. Stop when you reach the target number • 4. Don't select more than needed!
          </p>
        </div>

        <div className="mt-4 text-center">
          <div className="text-sm text-purple-600">
            Challenge: Select {targetCount} out of {targetAnimalsAvailable} available {targetAnimal?.name}s • Level {currentLevel}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default AnimalParadeCounter;