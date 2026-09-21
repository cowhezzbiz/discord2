import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import cors from 'cors';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Serve static files from client/dist
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));

// SPA fallback for client routes
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) {
      res.status(404).send('Client not built. Run `npm run build` first.');
    }
  });
});

interface PeerCustomization {
  profileGif?: string;
  bannerUrl?: string;
  accentColor: string;
  bio?: string;
}

interface Room {
  id: string;
  peers: Map<string, Peer>;
}

interface Peer {
  id: string;
  ws: WebSocket;
  roomId: string;
  username: string;
  isMuted: boolean;
  isDeafened: boolean;
  isScreenSharing: boolean;
  customization: PeerCustomization;
}

const rooms = new Map<string, Room>();

function getOrCreateRoom(roomId: string): Room {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, { id: roomId, peers: new Map() });
  }
  return rooms.get(roomId)!;
}

function broadcastToRoom(roomId: string, message: any, excludePeerId?: string) {
  const room = rooms.get(roomId);
  if (!room) return;
  
  const data = JSON.stringify(message);
  room.peers.forEach((peer) => {
    if (peer.id !== excludePeerId && peer.ws.readyState === WebSocket.OPEN) {
      peer.ws.send(data);
    }
  });
}

wss.on('connection', (ws: WebSocket) => {
  let currentPeer: Peer | null = null;

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      
      switch (msg.type) {
        case 'join': {
          const { roomId, peerId, username, customization } = msg;
          const room = getOrCreateRoom(roomId);
          
          currentPeer = {
            id: peerId,
            ws,
            roomId,
            username,
            isMuted: false,
            isDeafened: false,
            isScreenSharing: false,
            customization: customization || {
              accentColor: '#5865f2',
            },
          };
          
          room.peers.set(peerId, currentPeer);
          
          const existingPeers = Array.from(room.peers.values())
            .filter(p => p.id !== peerId)
            .map(p => ({
              id: p.id,
              username: p.username,
              isMuted: p.isMuted,
              isDeafened: p.isDeafened,
              isScreenSharing: p.isScreenSharing,
              customization: p.customization,
            }));
          
          ws.send(JSON.stringify({
            type: 'joined',
            peers: existingPeers,
            yourPeerId: peerId,
          }));
          
          broadcastToRoom(roomId, {
            type: 'peer-joined',
            peer: {
              id: peerId,
              username,
              isMuted: false,
              isDeafened: false,
              isScreenSharing: false,
              customization: currentPeer.customization,
            },
          }, peerId);
          
          console.log(`[${roomId}] ${username} joined`);
          break;
        }
        
        case 'update-customization': {
          if (currentPeer) {
            const updates = msg.customization;
            currentPeer.customization = { ...currentPeer.customization, ...updates };
            broadcastToRoom(currentPeer.roomId, {
              type: 'peer-customization-updated',
              peerId: currentPeer.id,
              customization: currentPeer.customization,
            });
          }
          break;
        }
        
        case 'offer':
        case 'answer':
        case 'ice-candidate': {
          if (currentPeer) {
            broadcastToRoom(currentPeer.roomId, {
              type: msg.type,
              from: currentPeer.id,
              to: msg.to,
              payload: msg.payload,
            }, currentPeer.id);
          }
          break;
        }
        
        case 'mute':
        case 'unmute': {
          if (currentPeer) {
            currentPeer.isMuted = msg.type === 'mute';
            broadcastToRoom(currentPeer.roomId, {
              type: 'peer-updated',
              peerId: currentPeer.id,
              isMuted: currentPeer.isMuted,
            });
          }
          break;
        }
        
        case 'deafen':
        case 'undeafen': {
          if (currentPeer) {
            currentPeer.isDeafened = msg.type === 'deafen';
            broadcastToRoom(currentPeer.roomId, {
              type: 'peer-updated',
              peerId: currentPeer.id,
              isDeafened: currentPeer.isDeafened,
            });
          }
          break;
        }
        
        case 'start-screen-share': {
          if (currentPeer) {
            currentPeer.isScreenSharing = true;
            broadcastToRoom(currentPeer.roomId, {
              type: 'peer-screen-share-started',
              peerId: currentPeer.id,
            });
          }
          break;
        }
        
        case 'stop-screen-share': {
          if (currentPeer) {
            currentPeer.isScreenSharing = false;
            broadcastToRoom(currentPeer.roomId, {
              type: 'peer-screen-share-stopped',
              peerId: currentPeer.id,
            });
          }
          break;
        }
        
        case 'chat-message': {
          if (currentPeer) {
            broadcastToRoom(currentPeer.roomId, {
              type: 'chat-message',
              from: currentPeer.id,
              username: currentPeer.username,
              message: msg.message,
              timestamp: Date.now(),
            });
          }
          break;
        }
        
        case 'leave': {
          if (currentPeer) {
            const room = rooms.get(currentPeer.roomId);
            if (room) {
              room.peers.delete(currentPeer.id);
              broadcastToRoom(currentPeer.roomId, {
                type: 'peer-left',
                peerId: currentPeer.id,
              });
              
              if (room.peers.size === 0) {
                rooms.delete(currentPeer.roomId);
              }
            }
            console.log(`[${currentPeer.roomId}] ${currentPeer.username} left`);
          }
          break;
        }
      }
    } catch (e) {
      console.error('Error handling message:', e);
    }
  });

  ws.on('close', () => {
    if (currentPeer) {
      const room = rooms.get(currentPeer.roomId);
      if (room) {
        room.peers.delete(currentPeer.id);
        broadcastToRoom(currentPeer.roomId, {
          type: 'peer-left',
          peerId: currentPeer.id,
        });
        
        if (room.peers.size === 0) {
          rooms.delete(currentPeer.roomId);
        }
      }
      console.log(`[${currentPeer.roomId}] ${currentPeer.username} disconnected`);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Discord2 server running on port ${PORT}`);
});
