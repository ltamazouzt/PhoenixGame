import { useEffect, useRef } from 'react';
import { NativeModules } from 'react-native';

type SoundModule = {
  MAIN_BUNDLE?: string;
  setCategory?: (category: string, mixWithOthers?: boolean) => void;
};

type SoundInstance = {
  play: (cb?: (success: boolean) => void) => void;
  stop: (cb?: () => void) => void;
  release: () => void;
  setNumberOfLoops: (loops: number) => void;
  setVolume: (volume: number) => void;
};

/**
 * Background music (optional).
 *
 * IMPORTANT: `react-native-sound` will crash at import-time if the native module
 * isn't compiled into the app yet. So we only require it after checking
 * `NativeModules.RNSound`.
 *
 * Asset expectations:
 * - Android: `android/app/src/main/res/raw/music.mp3` (or `.wav`) then load as "music.mp3"
 * - iOS: add `music.mp3` to the Xcode project (Copy Bundle Resources)
 */
export function useBackgroundMusic(enabled: boolean) {
  const soundRef = useRef<SoundInstance | null>(null);
  const isLoadedRef = useRef(false);

  useEffect(() => {
    if (!NativeModules?.RNSound) {
      // Native side not installed/built yet (e.g. missing pod install / rebuild).
      return;
    }

    let SoundCtor: (new (
      filename: string,
      basePathOrCallback?: unknown,
      callbackMaybe?: unknown,
    ) => SoundInstance) &
      SoundModule;

    try {
      const mod = require('react-native-sound');
      SoundCtor = (mod?.default ?? mod) as typeof SoundCtor;
    } catch {
      return;
    }

    try {
      SoundCtor.setCategory?.('Playback', true);
    } catch {
      // ignore
    }

    let isCancelled = false;

    // NOTE: we avoid `require('./music.xxx')` so Metro doesn't fail if the file is missing.
    const filename = 'music.mp3';

    const sound: SoundInstance = new (SoundCtor as any)(
      filename,
      (SoundCtor as any).MAIN_BUNDLE,
      (error: unknown) => {
        if (isCancelled) return;
        if (error) {
          isLoadedRef.current = false;
          return;
        }
        isLoadedRef.current = true;
        sound.setNumberOfLoops(-1);
        sound.setVolume(0.55);
        if (enabled) sound.play();
      },
    );

    soundRef.current = sound;

    return () => {
      isCancelled = true;
      try {
        soundRef.current?.stop();
      } catch {
        // ignore
      }
      try {
        soundRef.current?.release();
      } catch {
        // ignore
      }
      soundRef.current = null;
      isLoadedRef.current = false;
    };
    // Run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const sound = soundRef.current;
    if (!sound || !isLoadedRef.current) return;

    if (enabled) sound.play();
    else sound.stop();
  }, [enabled]);
}
