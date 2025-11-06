import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/button";

describe("Button", () => {
	it("renders correctly", () => {
		render(<Button>Click me</Button>);
		expect(
			screen.getByRole("button", { name: /click me/i }),
		).toBeInTheDocument();
	});

	it("handles click events", async () => {
		const handleClick = jest.fn();
		const user = userEvent.setup();

		render(<Button onClick={handleClick}>Click me</Button>);

		await user.click(screen.getByRole("button"));
		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it("can be disabled", () => {
		render(<Button disabled>Disabled</Button>);
		expect(screen.getByRole("button")).toBeDisabled();
	});

	it("applies variant classes correctly", () => {
		const { rerender } = render(<Button variant="default">Default</Button>);
		expect(screen.getByRole("button")).toBeInTheDocument();

		rerender(<Button variant="destructive">Destructive</Button>);
		expect(screen.getByRole("button")).toBeInTheDocument();

		rerender(<Button variant="outline">Outline</Button>);
		expect(screen.getByRole("button")).toBeInTheDocument();

		rerender(<Button variant="ghost">Ghost</Button>);
		expect(screen.getByRole("button")).toBeInTheDocument();
	});

	it("applies size classes correctly", () => {
		const { rerender } = render(<Button size="default">Default</Button>);
		expect(screen.getByRole("button")).toBeInTheDocument();

		rerender(<Button size="sm">Small</Button>);
		expect(screen.getByRole("button")).toBeInTheDocument();

		rerender(<Button size="lg">Large</Button>);
		expect(screen.getByRole("button")).toBeInTheDocument();

		rerender(<Button size="icon">Icon</Button>);
		expect(screen.getByRole("button")).toBeInTheDocument();
	});
});
