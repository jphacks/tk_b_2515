import { renderHook, act } from '@testing-library/react';
import { useAudioPreload } from '@/hooks/useAudioPreload';

// Mock the TTS API
jest.mock('@/lib/api/tts', () => ({
  textToSpeechUrl: jest.fn().mockResolvedValue('https://example.com/audio.mp3'),
}));

describe('useAudioPreload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides preload functions', () => {
    const { result } = renderHook(() => useAudioPreload());

    expect(result.current).toHaveProperty('preloadAudio');
    expect(result.current).toHaveProperty('preloadMultiple');
    expect(result.current).toHaveProperty('clearPreloadQueue');
    expect(result.current).toHaveProperty('isPreloaded');
  });

  it('preloads audio successfully', async () => {
    const { result } = renderHook(() => useAudioPreload());

    await act(async () => {
      await result.current.preloadAudio('Hello', 'voice-123');
    });

    expect(result.current.isPreloaded('Hello', 'voice-123')).toBe(true);
  });

  it('checks if audio is preloaded', async () => {
    const { result } = renderHook(() => useAudioPreload());

    expect(result.current.isPreloaded('Test', 'voice-123')).toBe(false);

    await act(async () => {
      await result.current.preloadAudio('Test', 'voice-123');
    });

    expect(result.current.isPreloaded('Test', 'voice-123')).toBe(true);
  });

  it('preloads multiple audio files', async () => {
    const { result } = renderHook(() => useAudioPreload());

    const items = [
      { text: 'Hello', voiceId: 'voice-1' },
      { text: 'World', voiceId: 'voice-1' },
    ];

    await act(async () => {
      await result.current.preloadMultiple(items);
    });

    expect(result.current.isPreloaded('Hello', 'voice-1')).toBe(true);
    expect(result.current.isPreloaded('World', 'voice-1')).toBe(true);
  });

  it('clears preload queue', async () => {
    const { result } = renderHook(() => useAudioPreload());

    await act(async () => {
      await result.current.preloadAudio('Test', 'voice-123');
    });

    expect(result.current.isPreloaded('Test', 'voice-123')).toBe(true);

    act(() => {
      result.current.clearPreloadQueue();
    });

    expect(result.current.isPreloaded('Test', 'voice-123')).toBe(false);
  });

  it('skips duplicate preload requests', async () => {
    const { textToSpeechUrl } = require('@/lib/api/tts');
    const { result } = renderHook(() => useAudioPreload());

    await act(async () => {
      await result.current.preloadAudio('Duplicate', 'voice-123');
      await result.current.preloadAudio('Duplicate', 'voice-123');
    });

    // Should only call TTS API once
    expect(textToSpeechUrl).toHaveBeenCalledTimes(1);
  });
});
