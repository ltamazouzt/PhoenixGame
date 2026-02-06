/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Game from './src/Game';
import StartScreen, { type Difficulty } from './src/StartScreen';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [bestScore, setBestScore] = useState(0);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      {difficulty ? (
        <Game
          difficulty={difficulty}
          best={bestScore}
          onBestChange={setBestScore}
          onBack={() => setDifficulty(null)}
        />
      ) : (
        <StartScreen best={bestScore} onSelect={setDifficulty} />
      )}
    </SafeAreaProvider>
  );
}

export default App;
