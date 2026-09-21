import { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

const WS_URL = 'wss://discord2-production-956f.up.railway.app';

export interface PeerCustomization {
  profileGif?: string;
  bannerUrl?: string;
  accentColor: string;
  bio?: string;
}

export const DEFAULT_CUSTOMIZATION: PeerCustomization = {
  accentColor: '#5865f2',
};

export interface Peer {
  id: string;
  username: string;
  isMuted: boolean;
  isDeafened: boolean;
  isScreenSharing: boolean;
  customization: PeerCustomization;
}

export interface ChatMessage {
  id: string;
  from: string;
  username: string;
  message: string;
  timestamp: number;
}

interface SignalingMessage {
  type: string;
  peers?: Peer[];
  yourPeerId?: string;
  peer?: Peer;
  peerId?: string;
  from?: string;
  username?: string;
  to?: string;
  payload?: any;
  isMuted?: boolean;
  isDeafened?: boolean;
  message?: string;
  timestamp?: number;
  customization?: PeerCustomization;
}

export function useSignaling(roomId: string, username: string, customization: PeerCustomization) {
  const [peers, setPeers] = useState<Map<string, Peer>>(new Map());
  const [myPeerId, setMyPeerId] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const peerIdRef = useRef<string>('');
  const onSignalRef = useRef<((from: string, payload: any) => void) | null>(null);

  useEffect(() => {
    const peerId = uuidv4();
    peerIdRef.current = peerId;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      ws.send(JSON.stringify({
        type: 'join',
        roomId,
        peerId,
        username,
        customization,
      }));
    };

    ws.onmessage = (event) => {
      const msg: SignalingMessage = JSON.parse(event.data);

      switch (msg.type) {
        case 'joined':
          setMyPeerId(msg.yourPeerId || '');
          if (msg.peers) {
            const newPeers = new Map<string, Peer>();
            msg.peers.forEach(p => newPeers.set(p.id, p));
            setPeers(newPeers);
          }
          break;

        case 'peer-joined':
          if (msg.peer) {
            setPeers(prev => {
              const next = new Map(prev);
              next.set(msg.peer!.id, msg.peer!);
              return next;
            });
          }
          break;

        case 'peer-left':
          if (msg.peerId) {
            setPeers(prev => {
              const next = new Map(prev);
              next.delete(msg.peerId!);
              return next;
            });
          }
          break;

        case 'peer-updated':
          if (msg.peerId) {
            setPeers(prev => {
              const next = new Map(prev);
              const peer = next.get(msg.peerId!);
              if (peer) {
                if (msg.isMuted !== undefined) peer.isMuted = msg.isMuted;
                if (msg.isDeafened !== undefined) peer.isDeafened = msg.isDeafened;
              }
              return next;
            });
          }
          break;

        case 'peer-customization-updated':
          if (msg.peerId && msg.customization) {
            setPeers(prev => {
              const next = new Map(prev);
              const peer = next.get(msg.peerId!);
              if (peer) {
                peer.customization = msg.customization!;
              }
              return next;
            });
          }
          break;

        case 'peer-screen-share-started':
          if (msg.peerId) {
            setPeers(prev => {
              const next = new Map(prev);
              const peer = next.get(msg.peerId!);
              if (peer) peer.isScreenSharing = true;
              return next;
            });
          }
          break;

        case 'peer-screen-share-stopped':
          if (msg.peerId) {
            setPeers(prev => {
              const next = new Map(prev);
              const peer = next.get(msg.peerId!);
              if (peer) peer.isScreenSharing = false;
              return next;
            });
          }
          break;

        case 'offer':
        case 'answer':
        case 'ice-candidate':
          if (msg.from && msg.payload && onSignalRef.current) {
            onSignalRef.current(msg.from, { type: msg.type, payload: msg.payload });
          }
          break;

        case 'chat-message':
          if (msg.from && msg.message) {
            setChatMessages(prev => [...prev, {
              id: uuidv4(),
              from: msg.from!,
              username: msg.username || 'Unknown',
              message: msg.message!,
              timestamp: msg.timestamp || Date.now(),
            }]);
          }
          break;
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      ws.send(JSON.stringify({ type: 'leave' }));
      ws.close();
    };
  }, [roomId, username, customization]);

  const sendSignal = useCallback((to: string, payload: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: payload.type,
        to,
        payload: payload.payload,
      }));
    }
  }, []);

  const sendOffer = useCallback((to: string, sdp: RTCSessionDescriptionInit) => {
    sendSignal(to, { type: 'offer', payload: sdp });
  }, [sendSignal]);

  const sendAnswer = useCallback((to: string, sdp: RTCSessionDescriptionInit) => {
    sendSignal(to, { type: 'answer', payload: sdp });
  }, [sendSignal]);

  const sendIceCandidate = useCallback((to: string, candidate: RTCIceCandidateInit) => {
    sendSignal(to, { type: 'ice-candidate', payload: candidate });
  }, [sendSignal]);

  const setOnSignal = useCallback((cb: (from: string, payload: any) => void) => {
    onSignalRef.current = cb;
  }, []);

  const updateCustomization = useCallback((newCustomization: PeerCustomization) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'update-customization',
        customization: newCustomization,
      }));
      setPeers(prev => {
        const next = new Map(prev);
        const peer = next.get(peerIdRef.current);
        if (peer) peer.customization = newCustomization;
        return next;
      });
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const me = Array.from(peers.values()).find(p => p.id === peerIdRef.current);
      if (me) {
        wsRef.current.send(JSON.stringify({
          type: me.isMuted ? 'unmute' : 'mute',
        }));
        setPeers(prev => {
          const next = new Map(prev);
          const peer = next.get(peerIdRef.current);
          if (peer) peer.isMuted = !peer.isMuted;
          return next;
        });
      }
    }
  }, [peers]);

  const toggleDeafen = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const me = Array.from(peers.values()).find(p => p.id === peerIdRef.current);
      if (me) {
        wsRef.current.send(JSON.stringify({
          type: me.isDeafened ? 'undeafen' : 'deafen',
        }));
        setPeers(prev => {
          const next = new Map(prev);
          const peer = next.get(peerIdRef.current);
          if (peer) peer.isDeafened = !peer.isDeafened;
          return next;
        });
      }
    }
  }, [peers]);

  const startScreenShare = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'start-screen-share' }));
      setPeers(prev => {
        const next = new Map(prev);
        const peer = next.get(peerIdRef.current);
        if (peer) peer.isScreenSharing = true;
        return next;
      });
    }
  }, []);

  const stopScreenShare = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'stop-screen-share' }));
      setPeers(prev => {
        const next = new Map(prev);
        const peer = next.get(peerIdRef.current);
        if (peer) peer.isScreenSharing = false;
        return next;
      });
    }
  }, []);

  const sendChatMessage = useCallback((message: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'chat-message',
        message,
      }));
    }
  }, []);

  return {
    peers,
    myPeerId,
    chatMessages,
    isConnected,
    sendOffer,
    sendAnswer,
    sendIceCandidate,
    setOnSignal,
    updateCustomization,
    toggleMute,
    toggleDeafen,
    startScreenShare,
    stopScreenShare,
    sendChatMessage,
  };
}
