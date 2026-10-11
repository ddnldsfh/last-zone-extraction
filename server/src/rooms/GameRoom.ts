import { Room, Client } from 'colyseus';
import { Schema, MapSchema, type } from '@colyseus/schema';

class Player extends Schema {
  @type('string') id = '';
  @type('number') x = 0;
  @type('number') y = 1.7;
  @type('number') z = 0;
  @type('number') yaw = 0;
  @type('number') health = 100;
  @type('boolean') alive = true;
}

class State extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
}

export class GameRoom extends Room<State> {
  maxClients = 8;

  onCreate() {
    this.setState(new State());

    this.onMessage('move', (client, data: { x: number; y: number; z: number; yaw: number }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      const safeX = Number.isFinite(data.x) ? data.x : player.x;
      const safeY = Number.isFinite(data.y) ? data.y : player.y;
      const safeZ = Number.isFinite(data.z) ? data.z : player.z;
      const safeYaw = Number.isFinite(data.yaw) ? data.yaw : player.yaw;

      if (Math.abs(safeX) > 40 || Math.abs(safeZ) > 40) return;

      player.x = safeX;
      player.y = safeY;
      player.z = safeZ;
      player.yaw = safeYaw;
    });

    this.onMessage('shoot', (client) => {
      const shooter = this.state.players.get(client.sessionId);
      if (!shooter || !shooter.alive) return;

      for (const [sessionId, target] of this.state.players.entries()) {
        if (sessionId === client.sessionId) continue;
        if (!target.alive) continue;

        const dx = target.x - shooter.x;
        const dz = target.z - shooter.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance < 3) {
          target.health = Math.max(0, target.health - 25);
          if (target.health <= 0) {
            target.health = 0;
            target.alive = false;
          }
        }
      }
    });
  }

  onJoin(client: Client) {
    const player = new Player();
    player.id = client.sessionId;
    player.x = 0;
    player.y = 1.7;
    player.z = 0;
    this.state.players.set(client.sessionId, player);
    console.log('Player joined:', client.sessionId);
  }

  onLeave(client: Client) {
    this.state.players.delete(client.sessionId);
    console.log('Player left:', client.sessionId);
  }
}
