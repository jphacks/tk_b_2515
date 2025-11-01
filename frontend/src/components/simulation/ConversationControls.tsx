import { Mic, MicOff, Phone, Video, VideoOff, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConversationControlsProps {
  isRecording: boolean;
  isProcessing: boolean;
  videoEnabled: boolean;
  stream: MediaStream | null;
  audioURL: string | null;
  showControls: boolean;
  timeRemaining: number | null;
  messageCount: number;
  avatarName?: string;
  onToggleRecording: () => void;
  onToggleVideo: () => void;
  onEndConversation: () => void;
  onToggleControls: () => void;
}

export function ConversationControls({
  isRecording,
  isProcessing,
  videoEnabled,
  stream,
  audioURL,
  showControls,
  timeRemaining,
  messageCount,
  avatarName = "まき",
  onToggleRecording,
  onToggleVideo,
  onEndConversation,
  onToggleControls,
}: ConversationControlsProps) {
  return (
    <div className="bg-card/95 backdrop-blur-md border-t border-border/50 shadow-2xl relative">
      {/* Toggle Button - Floating above controls */}
      <button
        type="button"
        onClick={onToggleControls}
        className="absolute -top-10 left-1/2 -translate-x-1/2 bg-card/95 backdrop-blur-md border border-border/50 rounded-t-lg px-4 py-2 shadow-lg hover:bg-card transition-all"
      >
        {showControls ? (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      <div
        className={`max-w-4xl mx-auto px-3 sm:px-4 md:px-6 space-y-3 sm:space-y-4 transition-all duration-300 overflow-hidden ${
          showControls
            ? "py-4 sm:py-5 md:py-6 max-h-96 opacity-100"
            : "py-0 max-h-0 opacity-0"
        }`}
      >
        {/* Status Text */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {isProcessing
              ? `${avatarName}が考えてるよ`
              : isRecording
              ? `${avatarName}が考えてるよ`
              : `「はなしかける」を押して${avatarName}に話しかけよう!`}
          </p>
          {timeRemaining !== null && (
            <p className="text-xs text-primary mt-2">
              残り時間: {Math.floor(timeRemaining / 60)}分
              {`${timeRemaining % 60}`.padStart(2, "0")}秒
            </p>
          )}
          {messageCount > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              会話ターン数: {Math.floor(messageCount / 2)}
            </p>
          )}
        </div>

        {/* Audio Playback */}
        {audioURL && (
          <div className="flex justify-center pb-2">
            <div className="w-full max-w-md bg-background/50 p-3 rounded-lg border border-border/50">
              <audio controls src={audioURL} className="w-full">
                <track kind="captions" />
              </audio>
            </div>
          </div>
        )}

        {/* Main Controls */}
        <div className="flex gap-2 sm:gap-3 md:gap-4 justify-center items-center flex-wrap">
          {/* Recording Button - Primary */}
          <Button
            size="lg"
            variant={isRecording ? "secondary" : "default"}
            className="rounded-full h-12 sm:h-14 md:h-16 px-6 sm:px-7 md:px-8 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
            onClick={onToggleRecording}
            disabled={!stream || isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 mr-1.5 sm:mr-2 animate-spin" />
                処理中
              </>
            ) : isRecording ? (
              <>
                <MicOff className="w-5 h-5 sm:w-6 sm:h-6 mr-1.5 sm:mr-2" />
                はなしおわる
              </>
            ) : (
              <>
                <Mic className="w-5 h-5 sm:w-6 sm:h-6 mr-1.5 sm:mr-2" />
                はなしかける
              </>
            )}
          </Button>

          {/* Video Toggle */}
          <Button
            size="lg"
            variant="outline"
            className="rounded-full h-12 sm:h-14 md:h-16 px-4 sm:px-5 md:px-6 hover:scale-105 transition-all"
            onClick={onToggleVideo}
            disabled={!stream}
          >
            {videoEnabled ? (
              <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <Video className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </Button>

          {/* End Call Button */}
          <Button
            size="lg"
            variant="destructive"
            className="rounded-full h-12 sm:h-14 md:h-16 px-6 sm:px-7 md:px-8 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
            onClick={onEndConversation}
          >
            <Phone className="w-5 h-5 sm:w-6 sm:h-6 mr-1.5 sm:mr-2 rotate-[135deg]" />
            会話終了
          </Button>
        </div>
      </div>
    </div>
  );
}
