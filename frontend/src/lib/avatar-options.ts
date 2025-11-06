export type AvatarOption = {
	id: string;
	label: string;
	src: string;
};

export const avatarOptions: AvatarOption[] = [
	{
		id: "sunny",
		label: "スマイルイエロー",
		src: "/avatars/avatar-1.svg",
	},
	{
		id: "sky",
		label: "さわやかブルー",
		src: "/avatars/avatar-2.svg",
	},
	{
		id: "peach",
		label: "ほのぼのピンク",
		src: "/avatars/avatar-3.svg",
	},
	{
		id: "leaf",
		label: "リラックスグリーン",
		src: "/avatars/avatar-4.svg",
	},
];
