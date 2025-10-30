import { Video, VideoOff } from "lucide-react";
import { memo, forwardRef } from "react";
import { VideoStream, type VideoStreamRef } from "@/components/VideoStream";

interface UserVideoDisplayProps {
  stream: MediaStream | null;
  videoEnabled: boolean;
  onVideoReady?: (videoElement: HTMLVideoElement) => void;
}

export const UserVideoDisplay = memo(
  forwardRef<VideoStreamRef, UserVideoDisplayProps>(
    ({ stream, videoEnabled, onVideoReady }, ref) => {
      return (
        <div className="w-full md:w-80 h-48 md:h-auto relative bg-black rounded-xl overflow-hidden border border-border/50 shadow-2xl flex flex-col">
          {stream && videoEnabled ? (
            <>
              <div className="flex-1 relative">
                <VideoStream
                  ref={ref}
                  stream={stream}
                  className="w-full h-full object-cover"
                  onVideoReady={onVideoReady}
                />
                {/* User Label */}
                <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                  <p className="text-white font-semibold text-sm flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    あなた
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-muted/20 to-muted/5">
              <VideoOff className="w-16 h-16 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground text-sm text-center px-4">
                cameraが
                <br />
                offです
              </p>
            </div>
          )}
        </div>
      );
    }
  )
);

UserVideoDisplay.displayName = "UserVideoDisplay";
