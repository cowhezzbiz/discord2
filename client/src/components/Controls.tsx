import { Monitor, Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare } from 'lucide-react';

function SpeakerX({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  );
}

function Headphones({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  );
}

interface ControlsProps {
  isMuted: boolean;
  isDeafened: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
  showChat: boolean;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleChat: () => void;
  onDisconnect: () => void;
}

export function Controls({
  isMuted,
  isDeafened,
  isVideoOn,
  isScreenSharing,
  showChat,
  onToggleMute,
  onToggleDeafen,
  onToggleVideo,
  onToggleScreenShare,
  onToggleChat,
  onDisconnect,
}: ControlsProps) {
  return (
    <div className="flex items-center justify-center gap-2 p-4 bg-[#0a0b0e] border-t border-white/5">
      <button
        onClick={onToggleMute}
        className={`p-3.5 rounded-xl font-medium transition-all ${
          isMuted ? 'bg-[#f87171] text-white' : 'bg-[#13141a] text-[#e8eaed] hover:bg-[#1a1c24]'
        }`}
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
      </button>

      <button
        onClick={onToggleDeafen}
        className={`p-3.5 rounded-xl font-medium transition-all ${
          isDeafened ? 'bg-[#f87171] text-white' : 'bg-[#13141a] text-[#e8eaed] hover:bg-[#1a1c24]'
        }`}
        title={isDeafened ? 'Undeafen' : 'Deafen'}
      >
        {isDeafened ? <SpeakerX size={20} /> : <Headphones size={20} />}
      </button>

      <button
        onClick={onToggleVideo}
        className={`p-3.5 rounded-xl font-medium transition-all ${
          !isVideoOn ? 'bg-[#f87171] text-white' : 'bg-[#13141a] text-[#e8eaed] hover:bg-[#1a1c24]'
        }`}
        title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
      >
        {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
      </button>

      <button
        onClick={onToggleScreenShare}
        className={`p-3.5 rounded-xl font-medium transition-all ${
          isScreenSharing ? 'bg-[#4ade80] text-white' : 'bg-[#13141a] text-[#e8eaed] hover:bg-[#1a1c24]'
        }`}
        title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
      >
        <Monitor size={20} />
      </button>

      <button
        onClick={onToggleChat}
        className={`p-3.5 rounded-xl font-medium transition-all ${
          showChat ? 'bg-[#7c5cff] text-white' : 'bg-[#13141a] text-[#e8eaed] hover:bg-[#1a1c24]'
        }`}
        title="Toggle chat"
      >
        <MessageSquare size={20} />
      </button>

      <button
        onClick={onDisconnect}
        className="p-3.5 rounded-xl bg-[#f87171] text-white hover:bg-[#dc2626] transition-all"
        title="Disconnect"
      >
        <PhoneOff size={20} />
      </button>
    </div>
  );
}
