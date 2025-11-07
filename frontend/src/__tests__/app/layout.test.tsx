// Mock better-auth and nanostores to avoid ESM issues
jest.mock("better-auth/react", () => ({
	__esModule: true,
	createAuthClient: jest.fn(() => ({
		useSession: jest.fn(),
		signIn: jest.fn(),
		signOut: jest.fn(),
	})),
}));

jest.mock("nanostores", () => ({
	__esModule: true,
	atom: jest.fn(),
	readonlyType: jest.fn(),
}));

import { metadata } from "../../app/layout";

describe("Layout metadata", () => {
	it("has correct title", () => {
		expect(metadata.title).toEqual("恋AI");
	});

	it("has correct description", () => {
		expect(metadata.description).toEqual(
			"バーチャル女子大生「まき」とのリアルタイム会話で、きみのコミュ力爆上げしちゃおう!",
		);
	});

	it("has all required metadata fields", () => {
		expect(metadata).toHaveProperty("title");
		expect(metadata).toHaveProperty("description");
	});

	it("does not have hardcoded icon path (uses app/icon.ico automatically)", () => {
		// Next.js App Router automatically detects app/icon.ico
		// No need to specify in metadata
		expect(metadata.icons).toBeUndefined();
	});
});
