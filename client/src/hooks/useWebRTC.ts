import { useState, useEffect, useRef, useCallback } from 'react';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
];

const AUDIO_CONSTRAINTS_HIGH_QUALITY = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  sampleRate: 48000,
  channelCount: 2,
};

export interface PeerConnection {
  peerId: string;
  pc: RTCPeerConnection;
  stream?: MediaStream;
  isScreenShare?: boolean;
}

export interface StreamSettings {
  resolution: '4k' | '1080p' | '720p' | '480p';
  fps: 60 | 30 | 15;
  bitrate: number; // kbps
}

export const DEFAULT_STREAM_SETTINGS: StreamSettings = {
  resolution: '4k',
  fps: 60,
  bitrate: 8000,
};

function getVideoConstraints(settings: StreamSettings) {
  const resolutions = {
    '4k': { width: 3840, height: 2160 },
    '1080p': { width: 1920, height: 1080 },
    '720p': { width: 1280, height: 720 },
    '480p': { width: 854, height: 480 },
  };
  const { width, height } = resolutions[settings.resolution];
  return {
    width: { ideal: width, min: 640, max: width },
    height: { ideal: height, min: 480, max: height },
    frameRate: { ideal: settings.fps, min: 15, max: settings.fps },
    aspectRatio: { ideal: 16 / 9 },
  };
}

export function useWebRTC(
  myPeerId: string,
  peers: Map<string, { id: string; username: string }>,
  sendOffer: (to: string, sdp: RTCSessionDescriptionInit) => void,
  sendAnswer: (to: string, sdp: RTCSessionDescriptionInit) => void,
  sendIceCandidate: (to: string, candidate: RTCIceCandidateInit) => void,
  setOnSignal: (cb: (from: string, payload: any) => void) => void,
) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [peerConnections, setPeerConnections] = useState<Map<string, PeerConnection>>(new Map());
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [screenShareStream, setScreenShareStream] = useState<MediaStream | null>(null);
  const [streamSettings, setStreamSettings] = useState<StreamSettings>(DEFAULT_STREAM_SETTINGS);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, PeerConnection>>(new Map());

  // Get local media stream with 4K 60fps
  const initLocalStream = useCallback(async (settings: StreamSettings = streamSettings) => {
    try {
      // Stop existing stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }

      const videoConstraints = getVideoConstraints(settings);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: AUDIO_CONSTRAINTS_HIGH_QUALITY,
      });

      // Apply bitrate constraints if supported
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && 'contentHint' in videoTrack) {
        videoTrack.contentHint = 'motion';
      }

      localStreamRef.current = stream;
      setLocalStream(stream);
      setStreamSettings(settings);

      // Update all peer connections with new stream
      peerConnectionsRef.current.forEach(peerConn => {
        const sender = peerConn.pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack);
        }
      });

      return stream;
    } catch (err) {
      console.error('Failed to get 4K stream, falling back to 1080p:', err);
      try {
        const fallbackSettings = { ...settings, resolution: '1080p' as const };
        const stream = await navigator.mediaDevices.getUserMedia({
          video: getVideoConstraints(fallbackSettings),
          audio: AUDIO_CONSTRAINTS_HIGH_QUALITY,
        });
        localStreamRef.current = stream;
        setLocalStream(stream);
        return stream;
      } catch (err2) {
        console.error('Failed to get 1080p stream, trying 720p:', err2);
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 1280, height: 720, frameRate: 30 },
            audio: true,
          });
          localStreamRef.current = stream;
          setLocalStream(stream);
          return stream;
        } catch (err3) {
          console.error('Failed to get any video stream:', err3);
          return null;
        }
      }
    }
  }, [streamSettings]);

  // Create peer connection with high-quality codec preference
  const createPeerConnection = useCallback((peerId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection({ 
      iceServers: ICE_SERVERS,
      iceCandidatePoolSize: 10,
    });

    // Add local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        const sender = pc.addTrack(track, localStreamRef.current!);
        
        // Set encoding parameters for high quality
        if (track.kind === 'video' && 'setParameters' in sender) {
          const params = (sender as RTCRtpSender).getParameters();
          if (!params.encodings) {
            params.encodings = [{}];
          }
          params.encodings[0].maxBitrate = streamSettings.bitrate * 1000;
          params.encodings[0].maxFramerate = streamSettings.fps;
          (sender as RTCRtpSender).setParameters(params).catch(() => {});
        }
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendIceCandidate(peerId, event.candidate.toJSON());
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      const [stream] = event.streams;
      setRemoteStreams(prev => {
        const next = new Map(prev);
        next.set(peerId, stream);
        return next;
      });
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${peerId}:`, pc.connectionState);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        pc.close();
        peerConnectionsRef.current.delete(peerId);
        setPeerConnections(prev => {
          const next = new Map(prev);
          next.delete(peerId);
          return next;
        });
        setRemoteStreams(prev => {
          const next = new Map(prev);
          next.delete(peerId);
          return next;
        });
      }
    };

    return pc;
  }, [sendIceCandidate, streamSettings.bitrate, streamSettings.fps]);

  // Handle signaling messages
  useEffect(() => {
    const handleSignal = async (from: string, msg: { type: string; payload: any }) => {
      const { type, payload } = msg;

      if (type === 'offer') {
        let pc: RTCPeerConnection;
        let peerConn = peerConnectionsRef.current.get(from);

        if (!peerConn) {
          pc = createPeerConnection(from);
          peerConn = { peerId: from, pc };
          peerConnectionsRef.current.set(from, peerConn);
          setPeerConnections(prev => {
            const next = new Map(prev);
            next.set(from, peerConn!);
            return next;
          });
        } else {
          pc = peerConn.pc;
        }

        // Prefer H.264 high profile for better quality
        const offer = new RTCSessionDescription(payload);
        await pc.setRemoteDescription(offer);
        
        const answer = await pc.createAnswer();
        
        // Modify SDP for higher bitrate
        if (answer.sdp) {
          answer.sdp = answer.sdp.replace(
            /(m=video.*\r\n)/g,
            `$1b=AS:${streamSettings.bitrate}\r\n`
          );
          answer.sdp = answer.sdp.replace(
            /(a=mid:video\r\n)/g,
            `a=mid:video\r\nb=AS:${streamSettings.bitrate}\r\n`
          );
        }
        
        await pc.setLocalDescription(answer);
        sendAnswer(from, answer);

      } else if (type === 'answer') {
        const peerConn = peerConnectionsRef.current.get(from);
        if (peerConn) {
          const answer = new RTCSessionDescription(payload);
          await peerConn.pc.setRemoteDescription(answer);
        }

      } else if (type === 'ice-candidate') {
        const peerConn = peerConnectionsRef.current.get(from);
        if (peerConn) {
          await peerConn.pc.addIceCandidate(new RTCIceCandidate(payload));
        }
      }
    };

    setOnSignal(handleSignal);
  }, [createPeerConnection, sendAnswer, setOnSignal, streamSettings.bitrate]);

  // Initiate calls to new peers
  useEffect(() => {
    const existingIds = new Set(peerConnectionsRef.current.keys());
    const currentIds = new Set(peers.keys());

    // New peers to call
    currentIds.forEach(peerId => {
      if (peerId !== myPeerId && !existingIds.has(peerId)) {
        const pc = createPeerConnection(peerId);
        const peerConn: PeerConnection = { peerId, pc };
        peerConnectionsRef.current.set(peerId, peerConn);
        setPeerConnections(prev => {
          const next = new Map(prev);
          next.set(peerId, peerConn);
          return next;
        });

        pc.createOffer().then(offer => {
          // Modify SDP for high quality
          if (offer.sdp) {
            offer.sdp = offer.sdp.replace(
              /(m=video.*\r\n)/g,
              `$1b=AS:${streamSettings.bitrate}\r\n`
            );
          }
          pc.setLocalDescription(offer).then(() => {
            sendOffer(peerId, offer);
          });
        });
      }
    });

    // Remove peers that left
    existingIds.forEach(peerId => {
      if (!currentIds.has(peerId)) {
        const peerConn = peerConnectionsRef.current.get(peerId);
        if (peerConn) {
          peerConn.pc.close();
          peerConnectionsRef.current.delete(peerId);
          setPeerConnections(prev => {
            const next = new Map(prev);
            next.delete(peerId);
            return next;
          });
          setRemoteStreams(prev => {
            const next = new Map(prev);
            next.delete(peerId);
            return next;
          });
        }
      }
    });
  }, [peers, myPeerId, createPeerConnection, sendOffer, streamSettings.bitrate]);

  // Start screen share (4K)
  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 3840, max: 3840 },
          height: { ideal: 2160, max: 2160 },
          frameRate: { ideal: 60, max: 60 },
        },
        audio: true,
      });
      setScreenStream(stream);
      setScreenShareStream(stream);

      const videoTrack = stream.getVideoTracks()[0];
      peerConnectionsRef.current.forEach(peerConn => {
        const sender = peerConn.pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });

      videoTrack.onended = () => {
        stopScreenShare();
      };

      return stream;
    } catch (err) {
      console.error('Failed to start screen share:', err);
      return null;
    }
  }, []);

  // Stop screen share
  const stopScreenShare = useCallback(() => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
      setScreenShareStream(null);

      if (localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        peerConnectionsRef.current.forEach(peerConn => {
          const sender = peerConn.pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender && videoTrack) {
            sender.replaceTrack(videoTrack);
          }
        });
      }
    }
  }, [screenStream]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return audioTrack.enabled;
      }
    }
    return false;
  }, []);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled;
      }
    }
    return false;
  }, []);

  // Update stream quality
  const updateStreamSettings = useCallback(async (newSettings: StreamSettings) => {
    await initLocalStream(newSettings);
  }, [initLocalStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      peerConnectionsRef.current.forEach(peerConn => {
        peerConn.pc.close();
      });
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    localStream,
    screenStream,
    screenShareStream,
    peerConnections,
    remoteStreams,
    streamSettings,
    initLocalStream,
    startScreenShare,
    stopScreenShare,
    toggleAudio,
    toggleVideo,
    updateStreamSettings,
  };
}
