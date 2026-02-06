declare module 'react-native-sound' {
  type Callback = (error?: unknown) => void;

  export default class Sound {
    static MAIN_BUNDLE: string;

    constructor(
      filename: string,
      basePath?: string,
      onError?: (error: unknown) => void,
    );

    static setCategory?(category: string, mixWithOthers?: boolean): void;

    setNumberOfLoops(loops: number): void;
    setVolume(volume: number): void;

    play(onEnd?: (success: boolean) => void): void;
    stop(onStop?: () => void): void;
    release(): void;
  }
}
