import './style.css';
import * as THREE from 'three';
import { Client, Room } from 'colyseus.js';

const app = document.querySelector('#app') as HTMLDivElement;

const menu = document.createElement('div');
menu.id = 'menu';

const title = document.createElement('h2');
title.textContent = 'LAST ZONE: EXTRACTION';

const roomCodeInput = document.createElement('input');
roomCodeInput.placeholder = 'Room code';

const createBtn = document.createElement('button');
createBtn.textContent = 'Create room';

const joinBtn = document.createElement('button');
joinBtn.textContent = 'Join room';
joinBtn.className = 'secondary';

menu.append(title, roomCodeInput, createBtn, joinBtn);
app.appendChild(menu);

const hud = document.createElement('div');
hud.id = 'hud';
app.appendChild(hud);

const roomInfo = document.createElement('div');
roomInfo.id = 'roomInfo';
roomInfo.textContent = 'Not connected';
hud.appendChild(roomInfo);

const healthLabel = document.createElement('div');
healthLabel.id = 'health';
healthLabel.textContent = 'Health: 100';
hud.appendChild(healthLabel);

const serverUrl = (import.meta.env.VITE_SERVER_URL as string) || 'ws://localhost:2567';
const client = new Client(serverUrl);

let room: Room | null = null;
let localHealth = 100;
const remotePlayers = new Map<string, THREE.Mesh>();
const moveState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  yaw: 0
};

const scene = new THREE.Scene();
scene.background = new THREE.Color('#091118');
scene.fog = new THREE.Fog('#091118', 14, 52);

const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 3, 8);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
app.appendChild(renderer.domElement);

const ambient = new THREE.HemisphereLight('#dfeaff', '#1a221b', 1.15);
scene.add(ambient);

const sun = new THREE.DirectionalLight('#f0f5ff', 1.25);
sun.position.set(8, 12, 4);
sun.castShadow = true;
scene.add(sun);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(90, 90),
  new THREE.MeshStandardMaterial({ color: '#2c3d3a', roughness: 0.96, metalness: 0.04 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const road = new THREE.Mesh(
  new THREE.BoxGeometry(20, 0.1, 3),
  new THREE.MeshStandardMaterial({ color: '#3d3d3d', roughness: 0.8 })
);
road.position.set(0, 0.05, 0);
scene.add(road);

const buildings = [
  { x: -15, z: -18, w: 8, h: 12, d: 8 },
  { x: 18, z: -20, w: 9, h: 10, d: 10 },
  { x: -22, z: 18, w: 7, h: 14, d: 7 },
  { x: 26, z: 12, w: 12, h: 8, d: 9 }
];

for (const b of buildings) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(b.w, b.h, b.d),
    new THREE.MeshStandardMaterial({ color: '#54656b', roughness: 0.8, metalness: 0.2 })
  );
  mesh.position.set(b.x, b.h / 2, b.z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
}

const localPlayer = new THREE.Group();
const localBody = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.45, 1.5, 6, 12),
  new THREE.MeshStandardMaterial({ color: '#5ea1ff', emissive: '#103d70' })
);
localBody.position.y = 1.3;
localBody.castShadow = true;
localPlayer.add(localBody);
scene.add(localPlayer);

const makeRemotePlayer = (id: string) => {
  const mesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.45, 1.5, 6, 12),
    new THREE.MeshStandardMaterial({ color: '#efb26a', emissive: '#734a1d' })
  );
  mesh.castShadow = true;
  mesh.position.set(0, 1.3, 0);
  mesh.userData.id = id;
  scene.add(mesh);
  remotePlayers.set(id, mesh);
  return mesh;
};

const updateRemotePlayers = () => {
  if (!room) return;
  const state: any = room.state;
  if (!state || !state.players) return;

  state.players.forEach((player: any, id: string) => {
    if (id === room!.sessionId) return;
    let mesh = remotePlayers.get(id);
    if (!mesh) mesh = makeRemotePlayer(id);

    mesh.position.set(player.x, 1.3, player.z);
    mesh.rotation.y = player.yaw;
  });
};

const applyLocalState = (player: any) => {
  localPlayer.position.set(player.x, player.y, player.z);
  localPlayer.rotation.y = player.yaw;
  localHealth = player.health;
  healthLabel.textContent = `Health: ${Math.max(0, Math.round(player.health))}`;
};

const syncRoomState = () => {
  if (!room) return;
  const state: any = room.state;
  if (!state || !state.players) return;

  state.players.forEach((player: any, id: string) => {
    if (id === room!.sessionId) {
      applyLocalState(player);
    }
  });

  updateRemotePlayers();
};

const sendMove = () => {
  if (!room) return;
  const pos = localPlayer.position;
  room.send('move', {
    x: Number(pos.x.toFixed(3)),
    y: Number(pos.y.toFixed(3)),
    z: Number(pos.z.toFixed(3)),
    yaw: Number(moveState.yaw.toFixed(3))
  });
};

const handleKey = (code: string, pressed: boolean) => {
  switch (code) {
    case 'KeyW':
      moveState.forward = pressed;
      break;
    case 'KeyS':
      moveState.backward = pressed;
      break;
    case 'KeyA':
      moveState.left = pressed;
      break;
    case 'KeyD':
      moveState.right = pressed;
      break;
  }
};

document.addEventListener('keydown', (event) => handleKey(event.code, true));
document.addEventListener('keyup', (event) => handleKey(event.code, false));

document.addEventListener('mousemove', (event) => {
  if (document.pointerLockElement !== document.body) return;
  moveState.yaw -= event.movementX * 0.0026;
});

document.addEventListener('click', () => {
  if (document.pointerLockElement !== document.body) {
    document.body.requestPointerLock();
    return;
  }

  if (room) {
    room.send('shoot');
  }
});

const setRoomInfo = (value: string) => {
  roomInfo.textContent = value;
};

const setupRoom = async (nextRoom: Room) => {
  room = nextRoom;
  room.onStateChange((state: any) => {
    syncRoomState();
  });

  room.onLeave(() => {
    setRoomInfo('Disconnected');
  });

  setRoomInfo(`Room: ${room.id}`);
};

createBtn.addEventListener('click', async () => {
  const nextRoom = await client.create('game');
  await setupRoom(nextRoom);
});

joinBtn.addEventListener('click', async () => {
  const code = roomCodeInput.value.trim();
  if (!code) {
    alert('Enter a room code.');
    return;
  }

  try {
    const nextRoom = await client.joinById(code);
    await setupRoom(nextRoom);
  } catch (error) {
    alert('Unable to join room. Check the code or server status.');
    console.error(error);
  }
});

const clock = new THREE.Clock();

function animate() {
  const dt = clock.getDelta();
  const speed = 5.6;

  const moveX = (moveState.right ? 1 : 0) - (moveState.left ? 1 : 0);
  const moveZ = (moveState.backward ? 1 : 0) - (moveState.forward ? 1 : 0);

  const forward = new THREE.Vector3(Math.sin(moveState.yaw), 0, Math.cos(moveState.yaw));
  const right = new THREE.Vector3(Math.cos(moveState.yaw), 0, -Math.sin(moveState.yaw));

  const direction = new THREE.Vector3();
  direction.addScaledVector(forward, moveZ);
  direction.addScaledVector(right, moveX);

  if (direction.lengthSq() > 0) {
    direction.normalize();
    localPlayer.position.x += direction.x * speed * dt;
    localPlayer.position.z += direction.z * speed * dt;
  }

  localPlayer.rotation.y = moveState.yaw;

  const cameraOffset = new THREE.Vector3(
    -Math.sin(moveState.yaw) * 5,
    2.8,
    -Math.cos(moveState.yaw) * 5
  );

  const lookTarget = new THREE.Vector3(
    localPlayer.position.x + Math.sin(moveState.yaw) * 6,
    localPlayer.position.y + 1.5,
    localPlayer.position.z + Math.cos(moveState.yaw) * 6
  );

  camera.position.lerp(
    new THREE.Vector3(
      localPlayer.position.x + cameraOffset.x,
      localPlayer.position.y + cameraOffset.y,
      localPlayer.position.z + cameraOffset.z
    ),
    0.12
  );
  camera.lookAt(lookTarget);

  if (room) sendMove();

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
