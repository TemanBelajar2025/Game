
import React, { useState, useCallback } from 'react';
import { GameState } from './types';
import type { SceneData } from './types';
import * as geminiService from './services/geminiService';
import Loader from './components/Loader';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.Start);
  const [story, setStory] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [choices, setChoices] = useState<string[]>([]);
  const [storyHistory, setStoryHistory] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleRestart = () => {
    setGameState(GameState.Start);
    setStory('');
    setImageUrl('');
    setChoices([]);
    setStoryHistory([]);
    setError(null);
  };

  const processNewScene = useCallback(async (choice: string | null) => {
    setGameState(GameState.Loading);
    setError(null);
    try {
      const currentHistory = choice ? [...storyHistory, `Player chose: ${choice}`] : [];
      
      const sceneData: SceneData = choice
        ? await geminiService.generateNextScene(storyHistory, choice)
        : await geminiService.generateInitialScene();

      const newImageUrl = await geminiService.generateImage(sceneData.imagePrompt);

      setStory(sceneData.sceneDescription);
      setChoices(sceneData.choices);
      setImageUrl(newImageUrl);
      setStoryHistory(prev => [...prev, sceneData.sceneDescription]);
      setGameState(GameState.Playing);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "An unknown error occurred. The spirits of adventure are confused.");
      setGameState(GameState.Error);
    }
  }, [storyHistory]);

  const handleChoice = (choice: string) => {
    processNewScene(choice);
  };

  const handleStartGame = () => {
    processNewScene(null);
  };

  const renderContent = () => {
    switch (gameState) {
      case GameState.Start:
        return (
          <div className="text-center bg-gray-800 bg-opacity-70 p-10 rounded-xl shadow-2xl">
            <h1 className="text-5xl font-bold font-serif text-white mb-4">Gemini Adventure</h1>
            <p className="text-xl text-gray-300 mb-8">An epic journey shaped by your choices, powered by AI.</p>
            <button
              onClick={handleStartGame}
              className="px-8 py-4 bg-indigo-600 text-white font-bold text-lg rounded-lg shadow-lg hover:bg-indigo-500 transition-all duration-300 transform hover:scale-105"
            >
              Begin Your Adventure
            </button>
          </div>
        );
      case GameState.Error:
        return (
          <div className="text-center bg-red-900 bg-opacity-50 p-10 rounded-xl shadow-2xl">
            <h2 className="text-3xl font-bold text-red-300 mb-4">An Unexpected Fog...</h2>
            <p className="text-lg text-gray-300 mb-6">{error}</p>
            <button
              onClick={handleRestart}
              className="px-6 py-3 bg-yellow-600 text-white font-bold rounded-lg hover:bg-yellow-500 transition-colors duration-300"
            >
              Start Anew
            </button>
          </div>
        );
      case GameState.Playing:
      case GameState.Loading:
        return (
          <div className="w-full max-w-5xl mx-auto bg-gray-800 rounded-2xl shadow-2xl overflow-hidden relative">
            {gameState === GameState.Loading && (
                <div className="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-20">
                    <Loader text="The storyteller is weaving your fate..." />
                </div>
            )}
            <div className={`transition-opacity duration-500 ${gameState === GameState.Loading ? 'opacity-50' : 'opacity-100'}`}>
                {imageUrl ? (
                    <img src={imageUrl} alt="Current scene" className="w-full h-auto aspect-video object-cover" />
                ) : (
                    <div className="w-full aspect-video bg-gray-700 flex items-center justify-center">
                        <p className="text-gray-400">Awaiting visual manifestation...</p>
                    </div>
                )}
                <div className="p-8">
                    <p className="text-gray-300 font-serif text-lg leading-relaxed whitespace-pre-wrap">{story}</p>
                </div>
                <div className="p-8 border-t border-gray-700">
                    <h3 className="text-xl font-bold text-indigo-300 mb-4">What will you do?</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {choices.map((choice, index) => (
                            <button
                                key={index}
                                onClick={() => handleChoice(choice)}
                                disabled={gameState === GameState.Loading}
                                className="w-full p-4 text-left bg-gray-700 rounded-lg hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 text-white font-semibold transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            >
                                {choice}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
             <button
                onClick={handleRestart}
                className="absolute top-4 right-4 px-4 py-2 bg-red-600 text-white font-bold text-sm rounded-lg shadow-lg hover:bg-red-500 transition-all duration-300 transform hover:scale-105 z-30"
                title="Restart Game"
              >
                Restart
              </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen w-full bg-gray-900 text-white flex items-center justify-center p-4 font-sans">
      {renderContent()}
    </main>
  );
};

export default App;
