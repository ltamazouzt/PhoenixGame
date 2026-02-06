import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export type Difficulty = 'easy' | 'medium' | 'hard';

export default function StartScreen({
  best,
  onSelect,
}: {
  best?: number;
  onSelect: (difficulty: Difficulty) => void;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.root}>
        <Text style={styles.title}>PhoenixGame</Text>
        <Text style={styles.subtitle}>Choisis la difficulté</Text>

        {typeof best === 'number' ? (
          <Text style={styles.best}>Best: {best}</Text>
        ) : null}

        <View style={styles.buttons}>
          <DifficultyButton
            label="Facile"
            hint="Plus lent + plus d'espace"
            onPress={() => onSelect('easy')}
          />
          <DifficultyButton
            label="Moyen"
            hint="Équilibré"
            onPress={() => onSelect('medium')}
          />
          <DifficultyButton
            label="Difficile"
            hint="Plus rapide + moins de marge"
            onPress={() => onSelect('hard')}
          />
        </View>

        <Text style={styles.footer}>Dans le jeu: tap pour sauter</Text>
      </View>
    </SafeAreaView>
  );
}

function DifficultyButton({
  label,
  hint,
  onPress,
}: {
  label: string;
  hint: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
    >
      <Text style={styles.buttonLabel}>{label}</Text>
      <Text style={styles.buttonHint}>{hint}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0B0B0F',
  },
  root: {
    flex: 1,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 16,
    marginBottom: 14,
  },
  best: {
    color: 'rgba(255,255,255,0.70)',
    fontSize: 14,
    marginBottom: 10,
  },
  buttons: {
    width: '100%',
    gap: 10,
  },
  button: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(17, 24, 39, 0.85)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  buttonPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.95,
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  buttonHint: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
  },
  footer: {
    marginTop: 14,
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
  },
});
