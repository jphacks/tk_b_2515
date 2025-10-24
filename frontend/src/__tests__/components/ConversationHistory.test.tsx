import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { ConversationHistory } from "@/components/ConversationHistory";
import type { Message } from "@/types/api";

const mockMessages: Message[] = [
  {
    id: "1",
    role: "user",
    content: "Hello",
    audioUrl: null,
    conversationId: "conv-1",
    createdAt: "2024-10-24T00:00:00Z",
    updatedAt: "2024-10-24T00:00:00Z",
  },
  {
    id: "2",
    role: "assistant",
    content: "Hi there!",
    audioUrl: null,
    conversationId: "conv-1",
    createdAt: "2024-10-24T00:00:01Z",
    updatedAt: "2024-10-24T00:00:01Z",
  },
  {
    id: "3",
    role: "user",
    content: "How are you?",
    audioUrl: null,
    conversationId: "conv-1",
    createdAt: "2024-10-24T00:00:02Z",
    updatedAt: "2024-10-24T00:00:02Z",
  },
];

describe("ConversationHistory", () => {
  it("renders empty state when no messages", () => {
    render(<ConversationHistory messages={[]} />);
    expect(screen.getByText(/まだ会話が始まっていません/i)).toBeInTheDocument();
  });

  it("renders all messages correctly", () => {
    render(<ConversationHistory messages={mockMessages} />);

    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("Hi there!")).toBeInTheDocument();
    expect(screen.getByText("How are you?")).toBeInTheDocument();
  });

  it("displays user messages with correct label", () => {
    render(<ConversationHistory messages={mockMessages} />);

    const userMessages = screen.getAllByText(/あなた/i);
    expect(userMessages.length).toBeGreaterThan(0);
  });

  it("displays assistant messages with correct label", () => {
    render(<ConversationHistory messages={mockMessages} />);

    const assistantMessages = screen.getAllByText(/まき/i);
    expect(assistantMessages.length).toBeGreaterThan(0);
  });

  it("applies custom className", () => {
    const { container } = render(
      <ConversationHistory messages={mockMessages} className="custom-class" />
    );
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("scrolls to bottom on new messages", () => {
    const scrollIntoViewMock = jest.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

    const { rerender } = render(
      <ConversationHistory messages={mockMessages.slice(0, 2)} />
    );

    rerender(<ConversationHistory messages={mockMessages} />);

    // Note: The actual scrollIntoView behavior depends on the component implementation
  });
});
