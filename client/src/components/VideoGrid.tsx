import { MicOff, Monitor } from 'lucide-react';

interface VideoGridProps {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  screenShareStream: MediaStream | null;
  peers: Map<string, { id: string; username: string; isMuted: boolean; isDeafened: boolean; isScreenSharing: boolean; customization: { profileGif?: string; bannerUrl?: string; accentColor: string; bio?: string } }>;
  myPeerId: string;
  isVideoOn: boolean;
}

export function VideoGrid({
  localStream,
  remoteStreams,
  screenShareStream,
  peers,
  myPeerId,
  isVideoOn,
}: VideoGridProps) {
  const peerArray = Array.from(peers.values());
  const hasScreenShare = screenShareStream || peerArray.some(p => p.isScreenSharing);
  const screenSharingPeer = peerArray.find(p => p.isScreenSharing);

  return (
    <div className="flex-1 overflow-hidden p-4 bg-[#050608] relative">
      {/* Screen share area */}
      {hasScreenShare && (
        <div className="mb-4 rounded-2xl overflow-hidden bg-[#000] aspect-video max-h-[60vh] relative ring-1 ring-white/10 shadow-2xl">
          {screenShareStream ? (
            <video
              autoPlay
              playsInline
              muted
              ref={(el) => {
                if (el && screenShareStream) {
                  el.srcObject = screenShareStream;
                }
              }}
              className="w-full h-full object-contain"
            />
          ) : screenSharingPeer ? (
            <RemoteVideo stream={remoteStreams.get(screenSharingPeer.id)} />
          ) : null}
          <div className="absolute top-3 left-3 bg-[#f87171]/90 backdrop-blur text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 font-medium">
            <Monitor size={12} />
            Screen Share
          </div>
        </div>
      )}

      {/* Video grid */}
      <div className={`grid gap-3 ${hasScreenShare ? 'grid-cols-3' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'}`}>
        {/* Local video */}
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-[#0f1014] ring-1 ring-white/5 shadow-lg animate-fadeIn">
          {localStream && isVideoOn ? (
            <video
              autoPlay
              playsInline
              muted
              ref={(el) => {
                if (el && localStream) {
                  el.srcObject = localStream;
                }
              }}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#13141a] to-[#0f1014]">
              <PeerAvatar peer={peers.get(myPeerId)!} size="lg" />
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 font-medium">
            {peers.get(myPeerId)?.username || 'You'}
            {peers.get(myPeerId)?.isMuted && <MicOff size={12} className="text-[#f87171]" />}
          </div>
        </div>

        {/* Remote videos */}
        {peerArray.filter(p => p.id !== myPeerId).map(peer => (
          <div key={peer.id} className="relative aspect-video rounded-2xl overflow-hidden bg-[#0f1014] ring-1 ring-white/5 shadow-lg animate-fadeIn">
            {remoteStreams.has(peer.id) ? (
              <RemoteVideo stream={remoteStreams.get(peer.id)!} />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#13141a] to-[#0f1014]">
                <PeerAvatar peer={peer} size="lg" />
              </div>
            )}
            <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 font-medium">
              {peer.username}
              {peer.isMuted && <MicOff size={12} className="text-[#f87171]" />}
              {peer.isScreenSharing && <Monitor size={12} className="text-[#4ade80]" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PeerAvatar({ peer, size = "md" }: { peer: { username: string; customization: { profileGif?: string; accentColor: string } }; size?: "md" | "lg" }) {
  const sizeClass = size === "lg" ? "w-20 h-20 text-3xl" : "w-16 h-16 text-2xl";
  const borderSize = size === "lg" ? "border-[3px]" : "border-2";
  
  if (peer.customization?.profileGif) {
    return (
      <img
        src={peer.customization.profileGif}
        alt={peer.username}
        className={`${sizeClass} rounded-full object-cover ${borderSize} border-white/10 shadow-lg`}
      />
    );
  }
  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center text-white font-semibold ${borderSize} border-white/10 shadow-lg`}
      style={{ backgroundColor: peer.customization?.accentColor || '#7c5cff' }}
    >
      {peer.username.charAt(0).toUpperCase()}
    </div>
  );
}

function RemoteVideo({ stream }: { stream?: MediaStream }) {
  return (
    <video
      autoPlay
      playsInline
      ref={(el) => {
        if (el && stream) {
          el.srcObject = stream;
        }
      }}
      className="w-full h-full object-cover"
    />
  );
}
