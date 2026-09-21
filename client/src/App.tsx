import { useState, useEffect, useCallback } from 'react';
import { Lobby } from './components/Lobby';
import { Controls } from './components/Controls';
import { VideoGrid } from './components/VideoGrid';
import { Chat } from './components/Chat';
import { NitroProfile } from './components/NitroProfile';
import { useSignaling, DEFAULT_CUSTOMIZATION } from './hooks/useSignaling';
import type { PeerCustomization } from './hooks/useSignaling';
import { useWebRTC, DEFAULT_STREAM_SETTINGS } from './hooks/useWebRTC';
import type { StreamSettings } from './hooks/useWebRTC';
import { Settings, Sparkles } from 'lucide-react';

function VoiceCall({ username, roomId, customization, onLeave }: {
  username: string;
  roomId: string;
  customization: PeerCustomization;
  onLeave: () => void;
}) {
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [streamSettings, setStreamSettings] = useState<StreamSettings>(DEFAULT_STREAM_SETTINGS);

  const {
    peers,
    myPeerId,
    chatMessages,
    isConnected,
    sendOffer,
    sendAnswer,
    sendIceCandidate,
    setOnSignal,
    updateCustomization,
    toggleMute: signalingMute,
    toggleDeafen: signalingDeafen,
    startScreenShare: signalingScreenStart,
    stopScreenShare: signalingScreenStop,
    sendChatMessage,
  } = useSignaling(roomId, username, customization);

  const {
    localStream,
    screenShareStream,
    remoteStreams,
    initLocalStream,
    startScreenShare: webrtcScreenStart,
    stopScreenShare: webrtcScreenStop,
    toggleAudio,
    toggleVideo,
    updateStreamSettings: webrtcUpdateSettings,
  } = useWebRTC(myPeerId, peers, sendOffer, sendAnswer, sendIceCandidate, setOnSignal);

  useEffect(() => {
    if (isConnected) {
      initLocalStream(streamSettings);
    }
  }, [isConnected, initLocalStream, streamSettings]);

  const handleToggleMute = useCallback(() => {
    const audioEnabled = toggleAudio();
    setIsMuted(!audioEnabled);
    signalingMute();
  }, [toggleAudio, signalingMute]);

  const handleToggleDeafen = useCallback(() => {
    setIsDeafened(!isDeafened);
    signalingDeafen();
  }, [isDeafened, signalingDeafen]);

  const handleToggleVideo = useCallback(() => {
    const videoEnabled = toggleVideo();
    setIsVideoOn(!videoEnabled);
  }, [toggleVideo]);

  const handleToggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      webrtcScreenStop();
      signalingScreenStop();
      setIsScreenSharing(false);
    } else {
      const stream = await webrtcScreenStart();
      if (stream) {
        signalingScreenStart();
        setIsScreenSharing(true);
      }
    }
  }, [isScreenSharing, webrtcScreenStart, webrtcScreenStop, signalingScreenStart, signalingScreenStop]);

  const handleDisconnect = useCallback(() => {
    onLeave();
  }, [onLeave]);

  const handleUpdateCustomization = useCallback((updates: Partial<PeerCustomization>) => {
    const newCustomization = { ...customization, ...updates };
    updateCustomization(newCustomization);
  }, [customization, updateCustomization]);

  const handleUpdateStreamSettings = useCallback((newSettings: StreamSettings) => {
    setStreamSettings(newSettings);
    webrtcUpdateSettings(newSettings);
  }, [webrtcUpdateSettings]);

  const peerArray = Array.from(peers.values());
  const myPeer = peerArray.find(p => p.id === myPeerId);

  return (
    <div className="flex flex-col h-screen bg-discord-darker">
      {/* Connection status */}
      {!isConnected && (
        <div className="bg-discord-yellow text-black text-center py-2 text-sm font-medium">
          Connecting...
        </div>
      )}

      {/* Top bar with profile & settings */}
      <div className="flex items-center justify-between px-4 py-2 bg-discord-darker border-b border-discord-dark">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: customization.accentColor }}>
            {username.charAt(0).toUpperCase()}
          </div>
          <span className="text-white font-medium">{username}</span>
          {myPeer?.customization.profileGif && (
            <Sparkles size={14} className="text-discord-yellow" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded bg-discord-light text-discord-text hover:bg-discord-lighter"
            title="Stream Settings"
          >
            <Settings size={18} />
          </button>
          <button
            onClick={() => setShowProfile(true)}
            className="p-2 rounded bg-discord-accent text-white hover:bg-discord-accent-hover flex items-center gap-1"
          >
            <Sparkles size={14} />
            Profile
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col">
          <VideoGrid
            localStream={localStream}
            remoteStreams={remoteStreams}
            screenShareStream={screenShareStream}
            peers={peers}
            myPeerId={myPeerId}
            isVideoOn={isVideoOn}
          />

          <Controls
            isMuted={isMuted}
            isDeafened={isDeafened}
            isVideoOn={isVideoOn}
            isScreenSharing={isScreenSharing}
            showChat={showChat}
            onToggleMute={handleToggleMute}
            onToggleDeafen={handleToggleDeafen}
            onToggleVideo={handleToggleVideo}
            onToggleScreenShare={handleToggleScreenShare}
            onToggleChat={() => setShowChat(!showChat)}
            onDisconnect={handleDisconnect}
          />
        </div>

        <Chat
          messages={chatMessages}
          onSendMessage={sendChatMessage}
          isOpen={showChat}
          onClose={() => setShowChat(false)}
        />
      </div>

      {/* Nitro Profile Modal */}
      <NitroProfile
        username={username}
        customization={customization}
        onUpdateCustomization={handleUpdateCustomization}
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
      />

      {/* Stream Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-discord-light rounded-xl p-6 w-96 max-w-full">
            <h3 className="text-white font-bold text-lg mb-4">Stream Quality</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-discord-text text-sm mb-1 block">Resolution</label>
                <select
                  value={streamSettings.resolution}
                  onChange={(e) => handleUpdateStreamSettings({ ...streamSettings, resolution: e.target.value as any })}
                  className="w-full bg-discord-darker text-white rounded px-3 py-2"
                >
                  <option value="4k">4K (2160p)</option>
                  <option value="1080p">1080p Full HD</option>
                  <option value="720p">720p HD</option>
                  <option value="480p">480p</option>
                </select>
              </div>

              <div>
                <label className="text-discord-text text-sm mb-1 block">Frame Rate</label>
                <select
                  value={streamSettings.fps}
                  onChange={(e) => handleUpdateStreamSettings({ ...streamSettings, fps: parseInt(e.target.value) as any })}
                  className="w-full bg-discord-darker text-white rounded px-3 py-2"
                >
                  <option value={60}>60 FPS</option>
                  <option value={30}>30 FPS</option>
                  <option value={15}>15 FPS</option>
                </select>
              </div>

              <div>
                <label className="text-discord-text text-sm mb-1 block">Bitrate (kbps)</label>
                <input
                  type="range"
                  min="1000"
                  max="20000"
                  step="500"
                  value={streamSettings.bitrate}
                  onChange={(e) => handleUpdateStreamSettings({ ...streamSettings, bitrate: parseInt(e.target.value) })}
                  className="w-full"
                />
                <span className="text-discord-muted text-xs">{streamSettings.bitrate} kbps</span>
              </div>

              <button
                onClick={() => setShowSettings(false)}
                className="w-full bg-discord-accent text-white rounded py-2 font-medium hover:bg-discord-accent-hover"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  const [joined, setJoined] = useState(false);
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [customization] = useState<PeerCustomization>(DEFAULT_CUSTOMIZATION);

  const handleJoin = useCallback((user: string, room: string) => {
    setUsername(user);
    setRoomId(room);
    setJoined(true);
  }, []);

  const handleLeave = useCallback(() => {
    setJoined(false);
    setUsername('');
    setRoomId('');
  }, []);

  if (joined) {
    return <VoiceCall username={username} roomId={roomId} customization={customization} onLeave={handleLeave} />;
  }

  return <Lobby onJoin={handleJoin} />;
}

export default App;
