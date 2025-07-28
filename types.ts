
export enum GameState {
  Start,
  Loading,
  Playing,
  Error,
}

export interface SceneData {
  sceneDescription: string;
  imagePrompt: string;
  choices: string[];
}
