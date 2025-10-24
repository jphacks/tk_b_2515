import { useMediaDevices } from "@/hooks/useMediaDevices";
import { renderHook, act, waitFor } from "@testing-library/react";

// Mock navigator.mediaDevices
const mockGetUserMedia = jest.fn();

Object.defineProperty(global.navigator, "mediaDevices", {
  writable: true,
  value: {
    getUserMedia: mockGetUserMedia,
  },
});

describe("useMediaDevices", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("initializes with null stream and no error", () => {
    const { result } = renderHook(() => useMediaDevices());

    expect(result.current.stream).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("successfully starts media stream", async () => {
    const mockStream = {
      getTracks: jest.fn(() => []),
      getAudioTracks: jest.fn(() => []),
      getVideoTracks: jest.fn(() => []),
    } as unknown as MediaStream;

    mockGetUserMedia.mockResolvedValue(mockStream);

    const { result } = renderHook(() => useMediaDevices());

    await act(async () => {
      await result.current.startStream();
    });

    await waitFor(() => {
      expect(result.current.stream).toBe(mockStream);
      expect(result.current.error).toBeNull();
    });
  });

  it("handles getUserMedia errors", async () => {
    const mockError = new Error("Permission denied");
    mockGetUserMedia.mockRejectedValue(mockError);

    const { result } = renderHook(() => useMediaDevices());

    await act(async () => {
      await result.current.startStream();
    });

    await waitFor(() => {
      expect(result.current.stream).toBeNull();
      expect(result.current.error).toBeTruthy();
    });
  });

  it("stops media stream", async () => {
    const mockTrack = {
      stop: jest.fn(),
    };
    const mockStream = {
      getTracks: jest.fn(() => [mockTrack]),
      getAudioTracks: jest.fn(() => []),
      getVideoTracks: jest.fn(() => []),
    } as unknown as MediaStream;

    mockGetUserMedia.mockResolvedValue(mockStream);

    const { result } = renderHook(() => useMediaDevices());

    await act(async () => {
      await result.current.startStream();
    });

    act(() => {
      result.current.stopStream();
    });

    expect(mockTrack.stop).toHaveBeenCalled();
    expect(result.current.stream).toBeNull();
  });

  it("requests specific constraints", async () => {
    const mockStream = {
      getTracks: jest.fn(() => []),
      getAudioTracks: jest.fn(() => []),
      getVideoTracks: jest.fn(() => []),
    } as unknown as MediaStream;

    mockGetUserMedia.mockResolvedValue(mockStream);

    const { result } = renderHook(() => useMediaDevices());

    const constraints = {
      video: { width: 1280, height: 720 },
      audio: true,
    };

    await act(async () => {
      await result.current.startStream(constraints);
    });

    expect(mockGetUserMedia).toHaveBeenCalledWith(constraints);
  });
});
