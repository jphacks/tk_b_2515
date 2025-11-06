import { render, screen } from "@testing-library/react";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

describe("Card Components", () => {
	describe("Card", () => {
		it("renders children correctly", () => {
			render(
				<Card>
					<div>Card Content</div>
				</Card>,
			);
			expect(screen.getByText("Card Content")).toBeInTheDocument();
		});

		it("applies custom className", () => {
			const { container } = render(
				<Card className="custom-class">Content</Card>,
			);
			expect(container.firstChild).toHaveClass("custom-class");
		});
	});

	describe("CardHeader", () => {
		it("renders header content", () => {
			render(
				<CardHeader>
					<div>Header</div>
				</CardHeader>,
			);
			expect(screen.getByText("Header")).toBeInTheDocument();
		});
	});

	describe("CardTitle", () => {
		it("renders title text", () => {
			render(<CardTitle>Card Title</CardTitle>);
			expect(screen.getByText("Card Title")).toBeInTheDocument();
		});
	});

	describe("CardDescription", () => {
		it("renders description text", () => {
			render(<CardDescription>Card Description</CardDescription>);
			expect(screen.getByText("Card Description")).toBeInTheDocument();
		});
	});

	describe("CardContent", () => {
		it("renders content", () => {
			render(<CardContent>Main Content</CardContent>);
			expect(screen.getByText("Main Content")).toBeInTheDocument();
		});
	});

	describe("CardFooter", () => {
		it("renders footer", () => {
			render(<CardFooter>Footer Content</CardFooter>);
			expect(screen.getByText("Footer Content")).toBeInTheDocument();
		});
	});

	describe("Full Card Structure", () => {
		it("renders complete card with all sections", () => {
			render(
				<Card>
					<CardHeader>
						<CardTitle>Test Title</CardTitle>
						<CardDescription>Test Description</CardDescription>
					</CardHeader>
					<CardContent>Test Content</CardContent>
					<CardFooter>Test Footer</CardFooter>
				</Card>,
			);

			expect(screen.getByText("Test Title")).toBeInTheDocument();
			expect(screen.getByText("Test Description")).toBeInTheDocument();
			expect(screen.getByText("Test Content")).toBeInTheDocument();
			expect(screen.getByText("Test Footer")).toBeInTheDocument();
		});
	});
});
