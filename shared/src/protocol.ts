export type Vector3 = {
  x: number;
  y: number;
  z: number;
};

export type PlayerState = {
  id: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  health: number;
  alive: boolean;
};

export type RoomStateSnapshot = {
  players: Record<string, PlayerState>;
};
