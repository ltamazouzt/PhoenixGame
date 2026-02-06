import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Dimensions,
  Image,
  type ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Difficulty } from './StartScreen';

type Obstacle = {
  id: number;
  x: number;
  width: number;
  height: number;
  sprite: ImageSourcePropType;
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const GROUND_HEIGHT = 110;
const GRAVITY_PX_S2 = 2800;
const JUMP_VELOCITY_PX_S = 980;
const MAX_JUMPS = 2;
const PLAYER_WIDTH = 44;
const PLAYER_HEIGHT = 74;

const PLAYER_SPRITE: ImageSourcePropType = require('./ChickenWalk_01.png');
const BACKGROUND_SPRITE: ImageSourcePropType = require('./03b_Building_Large_with_Windows.png');
const OBSTACLE_SPRITE_KEVEN: ImageSourcePropType = require('./Keven 1.png');
const OBSTACLE_SPRITE_ROCKET: ImageSourcePropType = require('./Rocket Mike.png');

const DIFFICULTY_CONFIG: Record<
  Difficulty,
  {
    baseSpeedPxS: number;
    maxSpeedPxS: number;
    minGapTimeS: number;
    gapMinPx: number;
    gapMaxPx: number;
  }
> = {
  easy: {
    baseSpeedPxS: 260,
    maxSpeedPxS: 760,
    minGapTimeS: 1.05,
    gapMinPx: 340,
    gapMaxPx: 560,
  },
  medium: {
    baseSpeedPxS: 320,
    maxSpeedPxS: 820,
    minGapTimeS: 0.95,
    gapMinPx: 310,
    gapMaxPx: 520,
  },
  hard: {
    baseSpeedPxS: 390,
    maxSpeedPxS: 900,
    minGapTimeS: 0.86,
    gapMinPx: 290,
    gapMaxPx: 500,
  },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function intersects(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
) {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export default function Game({
  difficulty,
  best,
  onBestChange,
  onBack,
  musicEnabled,
  onMusicEnabledChange,
}: {
  difficulty: Difficulty;
  best: number;
  onBestChange: (nextBest: number) => void;
  onBack: () => void;
  musicEnabled: boolean;
  onMusicEnabledChange: (enabled: boolean) => void;
}) {
  const groundY = SCREEN_HEIGHT - GROUND_HEIGHT;

  const config = DIFFICULTY_CONFIG[difficulty];
  const { baseSpeedPxS, gapMaxPx, gapMinPx, maxSpeedPxS, minGapTimeS } = config;

  const [isRunning, setIsRunning] = useState(true);
  const isRunningRef = useRef(true);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const bestRef = useRef(best);
  const onBestChangeRef = useRef(onBestChange);

  const [playerY, setPlayerY] = useState(groundY - PLAYER_HEIGHT);
  const playerYRef = useRef(playerY);

  const velocityYRef = useRef(0);
  const onGroundRef = useRef(true);
  const jumpsUsedRef = useRef(0);

  const nextObstacleId = useRef(1);
  const [obstacles, setObstacles] = useState<Obstacle[]>(() => {
    const firstX = SCREEN_WIDTH + 120;
    return [
      {
        id: nextObstacleId.current++,
        x: firstX,
        width: 46,
        height: 56,
        sprite: OBSTACLE_SPRITE_KEVEN,
      },
    ];
  });
  const obstaclesRef = useRef(obstacles);

  const speedRef = useRef(baseSpeedPxS);

  const lastTimestampRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    bestRef.current = best;
  }, [best]);

  useEffect(() => {
    onBestChangeRef.current = onBestChange;
  }, [onBestChange]);

  useEffect(() => {
    playerYRef.current = playerY;
  }, [playerY]);

  useEffect(() => {
    obstaclesRef.current = obstacles;
  }, [obstacles]);

  const playerX = useMemo(() => Math.round(SCREEN_WIDTH * 0.22), []);

  const reset = () => {
    const startY = groundY - PLAYER_HEIGHT;
    setPlayerY(startY);
    playerYRef.current = startY;
    velocityYRef.current = 0;
    onGroundRef.current = true;
    jumpsUsedRef.current = 0;

    speedRef.current = baseSpeedPxS;

    nextObstacleId.current = 1;
    const firstX = SCREEN_WIDTH + 120;
    const initialObstacles: Obstacle[] = [
      {
        id: nextObstacleId.current++,
        x: firstX,
        width: 46,
        height: 56,
        sprite: OBSTACLE_SPRITE_KEVEN,
      },
    ];
    setObstacles(initialObstacles);
    obstaclesRef.current = initialObstacles;

    scoreRef.current = 0;
    setScore(0);
    lastTimestampRef.current = null;
    isRunningRef.current = true;
    setIsRunning(true);
  };

  const gameOver = useCallback(() => {
    isRunningRef.current = false;
    setIsRunning(false);
    const nextBest = Math.max(bestRef.current, scoreRef.current);
    bestRef.current = nextBest;
    onBestChangeRef.current(nextBest);
  }, []);

  const jump = () => {
    if (!isRunning) {
      reset();
      return;
    }

    // Double jump: allow up to MAX_JUMPS before landing again.
    if (jumpsUsedRef.current >= MAX_JUMPS) return;

    // If we're jumping from the ground, mark airborne.
    if (onGroundRef.current) {
      onGroundRef.current = false;
    }

    jumpsUsedRef.current += 1;
    velocityYRef.current = -JUMP_VELOCITY_PX_S;
  };

  useEffect(() => {
    const tick = (timestamp: number) => {
      const prev = lastTimestampRef.current;
      lastTimestampRef.current = timestamp;

      if (!isRunningRef.current) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const dt = prev == null ? 0 : (timestamp - prev) / 1000;
      const delta = clamp(dt, 0, 0.05);

      // Ramp difficulty slowly
      speedRef.current = Math.min(maxSpeedPxS, speedRef.current + 9 * delta);

      // Physics
      const newVelY = velocityYRef.current + GRAVITY_PX_S2 * delta;
      let newPlayerY = playerYRef.current + newVelY * delta;

      const floorY = groundY - PLAYER_HEIGHT;
      if (newPlayerY >= floorY) {
        newPlayerY = floorY;
        velocityYRef.current = 0;
        onGroundRef.current = true;
        jumpsUsedRef.current = 0;
      } else {
        velocityYRef.current = newVelY;
      }

      playerYRef.current = newPlayerY;
      setPlayerY(newPlayerY);

      // Obstacles update
      const updated = obstaclesRef.current
        .map(o => ({
          ...o,
          x: o.x - speedRef.current * delta,
        }))
        .filter(o => o.x + o.width > -40);

      // Spawn new obstacle if needed
      const last = updated[updated.length - 1];
      if (!last || last.x < SCREEN_WIDTH - 40) {
        const gapRandom = randomBetween(gapMinPx, gapMaxPx);
        const gapTimeBased = speedRef.current * minGapTimeS;
        const gap = Math.max(gapRandom, gapTimeBased);
        const nextX = (last ? last.x + last.width : SCREEN_WIDTH) + gap;
        const height = Math.round(randomBetween(44, 78));
        const width = Math.round(randomBetween(34, 60));
        const sprite =
          Math.random() < 0.5 ? OBSTACLE_SPRITE_KEVEN : OBSTACLE_SPRITE_ROCKET;
        updated.push({
          id: nextObstacleId.current++,
          x: nextX,
          width,
          height,
          sprite,
        });
      }

      obstaclesRef.current = updated;
      setObstacles(updated);

      // Score
      const inc = Math.round(60 * delta);
      if (inc > 0) {
        setScore(s => {
          const next = s + inc;
          scoreRef.current = next;
          return next;
        });
      }

      // Collision
      const playerBox = {
        x: playerX,
        y: playerYRef.current,
        w: PLAYER_WIDTH,
        h: PLAYER_HEIGHT,
      };

      const hit = updated.some(o => {
        const obsBox = {
          x: o.x,
          y: groundY - o.height,
          w: o.width,
          h: o.height,
        };
        return intersects(playerBox, obsBox);
      });

      if (hit) {
        gameOver();
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [
    gameOver,
    gapMaxPx,
    gapMinPx,
    groundY,
    maxSpeedPxS,
    minGapTimeS,
    playerX,
  ]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.root}>
        <Pressable style={styles.playArea} onPress={jump}>
          {/* Background */}
          <Image source={BACKGROUND_SPRITE} style={styles.background} />

          {/* Ground */}
          <View style={[styles.ground, { height: GROUND_HEIGHT }]}>
            <View style={styles.groundStripe} />
          </View>

          {/* Player */}
          <StickMan x={playerX} y={playerY} source={PLAYER_SPRITE} />

          {/* Obstacles */}
          {obstacles.map(o => (
            <View
              key={o.id}
              style={[
                styles.obstacle,
                {
                  left: o.x,
                  width: o.width,
                  height: o.height,
                  top: groundY - o.height,
                },
              ]}
              pointerEvents="none"
            >
              <Image source={o.sprite} style={styles.obstacleImage} />
            </View>
          ))}

          {!isRunning ? (
            <View style={styles.overlay} pointerEvents="none">
              <View style={styles.gameOverCard}>
                <Text style={styles.gameOverTitle}>Game Over</Text>
                <Text style={styles.gameOverText}>Tap pour recommencer</Text>
              </View>
            </View>
          ) : null}
        </Pressable>

        <View style={styles.topBar} pointerEvents="box-none">
          <Hud score={score} best={best} isRunning={isRunning} />
          <View style={styles.topButtons}>
            <Pressable onPress={onBack} style={styles.backButton} hitSlop={10}>
              <Text style={styles.backButtonText}>Retour Levels</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function Hud({
  score,
  best,
  isRunning,
}: {
  score: number;
  best: number;
  isRunning: boolean;
}) {
  return (
    <View style={styles.hud} pointerEvents="none">
      <View style={styles.hudRow}>
        <Text style={styles.hudLabel}>Score</Text>
        <Text style={styles.hudValue}>{score}</Text>
      </View>
      <View style={styles.hudRow}>
        <Text style={styles.hudLabel}>Best</Text>
        <Text style={styles.hudValue}>{best}</Text>
      </View>
      {!isRunning ? (
        <Text style={styles.hudHint}>Tap pour restart</Text>
      ) : (
        <Text style={styles.hudHint}>Tap pour sauter (x2)</Text>
      )}
    </View>
  );
}

function StickMan({
  x,
  y,
  source,
}: {
  x: number;
  y: number;
  source?: ImageSourcePropType;
}) {
  return (
    <View
      style={[
        styles.player,
        {
          left: x,
          top: y,
          width: PLAYER_WIDTH,
          height: PLAYER_HEIGHT,
        },
      ]}
      pointerEvents="none"
    >
      {source ? (
        <Image source={source} style={styles.playerImage} />
      ) : (
        <>
          <View style={styles.playerHead} />
          <View style={styles.playerBody} />
          <View style={[styles.playerLimb, styles.playerArmLeft]} />
          <View style={[styles.playerLimb, styles.playerArmRight]} />
          <View style={[styles.playerLimb, styles.playerLegLeft]} />
          <View style={[styles.playerLimb, styles.playerLegRight]} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0B0B0F',
  },
  root: {
    flex: 1,
    backgroundColor: '#0B0B0F',
  },
  playArea: {
    flex: 1,
    backgroundColor: '#0B0B0F',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
    paddingHorizontal: 12,
    zIndex: 20,
  },
  topButtons: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  musicButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(17, 24, 39, 0.75)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  musicButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  sky: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0B0B0F',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
    resizeMode: 'cover',
  },
  ground: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#111827',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.10)',
  },
  groundStripe: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 18,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  hud: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    alignSelf: 'flex-end',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(17, 24, 39, 0.75)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  hudRow: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(17, 24, 39, 0.70)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    minWidth: 108,
  },
  hudLabel: {
    color: 'rgba(255,255,255,0.70)',
    fontSize: 12,
    marginBottom: 2,
  },
  hudValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  hudHint: {
    alignSelf: 'center',
    color: 'rgba(255,255,255,0.60)',
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(17, 24, 39, 0.55)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  obstacle: {
    position: 'absolute',
    borderRadius: 12,
    overflow: 'hidden',
  },
  obstacleImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  player: {
    position: 'absolute',
  },
  playerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  playerHead: {
    position: 'absolute',
    top: 0,
    left: 12,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
  },
  playerBody: {
    position: 'absolute',
    top: 18,
    left: 21,
    width: 2,
    height: 26,
    backgroundColor: '#F9FAFB',
  },
  playerLimb: {
    position: 'absolute',
    width: 2,
    backgroundColor: '#F9FAFB',
  },
  playerArmLeft: {
    top: 24,
    left: 21,
    height: 16,
    transform: [{ rotateZ: '-35deg' }],
  },
  playerArmRight: {
    top: 24,
    left: 21,
    height: 16,
    transform: [{ rotateZ: '35deg' }],
  },
  playerLegLeft: {
    top: 42,
    left: 21,
    height: 22,
    transform: [{ rotateZ: '-20deg' }],
  },
  playerLegRight: {
    top: 42,
    left: 21,
    height: 22,
    transform: [{ rotateZ: '20deg' }],
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameOverCard: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(17, 24, 39, 0.85)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  gameOverTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  gameOverText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    textAlign: 'center',
  },
});
