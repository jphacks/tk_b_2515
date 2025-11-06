// Simple Romaji to Hiragana converter to map avatar file names (romaji) to hiragana.
// This is not a full IME, but supports common syllables and small-tsu.

const DIGRAPHS: Record<string, string> = {
	kya: "きゃ",
	kyu: "きゅ",
	kyo: "きょ",
	gya: "ぎゃ",
	gyu: "ぎゅ",
	gyo: "ぎょ",
	sha: "しゃ",
	shu: "しゅ",
	sho: "しょ",
	sya: "しゃ",
	syu: "しゅ",
	syo: "しょ",
	ja: "じゃ",
	ju: "じゅ",
	jo: "じょ",
	jya: "じゃ",
	jyu: "じゅ",
	jyo: "じょ",
	cha: "ちゃ",
	chu: "ちゅ",
	cho: "ちょ",
	cya: "ちゃ",
	cyu: "ちゅ",
	cyo: "ちょ",
	nya: "にゃ",
	nyu: "にゅ",
	nyo: "にょ",
	hya: "ひゃ",
	hyu: "ひゅ",
	hyo: "ひょ",
	bya: "びゃ",
	byu: "びゅ",
	byo: "びょ",
	pya: "ぴゃ",
	pyu: "ぴゅ",
	pyo: "ぴょ",
	mya: "みゃ",
	myu: "みゅ",
	myo: "みょ",
	rya: "りゃ",
	ryu: "りゅ",
	ryo: "りょ",
	// Special common cases
	tsu: "つ",
	shi: "し",
	chi: "ち",
	fu: "ふ",
	ji: "じ",
};

const MONOGRAPHS: Record<string, string> = {
	a: "あ",
	i: "い",
	u: "う",
	e: "え",
	o: "お",
	ka: "か",
	ki: "き",
	ku: "く",
	ke: "け",
	ko: "こ",
	ga: "が",
	gi: "ぎ",
	gu: "ぐ",
	ge: "げ",
	go: "ご",
	sa: "さ",
	si: "し",
	su: "す",
	se: "せ",
	so: "そ",
	za: "ざ",
	zi: "じ",
	zu: "ず",
	ze: "ぜ",
	zo: "ぞ",
	ta: "た",
	ti: "ち",
	tu: "つ",
	te: "て",
	to: "と",
	da: "だ",
	di: "ぢ",
	du: "づ",
	de: "で",
	do: "ど",
	na: "な",
	ni: "に",
	nu: "ぬ",
	ne: "ね",
	no: "の",
	ha: "は",
	hi: "ひ",
	hu: "ふ",
	he: "へ",
	ho: "ほ",
	ba: "ば",
	bi: "び",
	bu: "ぶ",
	be: "べ",
	bo: "ぼ",
	pa: "ぱ",
	pi: "ぴ",
	pu: "ぷ",
	pe: "ぺ",
	po: "ぽ",
	ma: "ま",
	mi: "み",
	mu: "む",
	me: "め",
	mo: "も",
	ya: "や",
	yu: "ゆ",
	yo: "よ",
	ra: "ら",
	ri: "り",
	ru: "る",
	re: "れ",
	ro: "ろ",
	wa: "わ",
	wi: "うぃ",
	we: "うぇ",
	wo: "を",
	n: "ん",
};

const CONSONANTS = new Set(
	Array.from("bcdfghjklmnpqrstvwxyz").filter((c) => c !== "y"),
);

export function romajiToHiragana(input: string): string {
	const s = input.toLowerCase().replace(/[^a-z]/g, "");
	if (!s) return "";
	let result = "";
	for (let i = 0; i < s.length; ) {
		// Handle double consonant (small tsu), except 'n'
		if (
			i + 1 < s.length &&
			s[i] === s[i + 1] &&
			s[i] !== "n" &&
			CONSONANTS.has(s[i])
		) {
			result += "っ";
			i += 1;
			continue;
		}

		// Try 3-letter digraphs first
		if (i + 2 < s.length) {
			const tri = s.substring(i, i + 3);
			if (DIGRAPHS[tri]) {
				result += DIGRAPHS[tri];
				i += 3;
				continue;
			}
		}

		// Try 2-letter syllables
		if (i + 1 < s.length) {
			const di = s.substring(i, i + 2);
			if (DIGRAPHS[di]) {
				result += DIGRAPHS[di];
				i += 2;
				continue;
			}
			if (MONOGRAPHS[di]) {
				result += MONOGRAPHS[di];
				i += 2;
				continue;
			}
		}

		// Single letter
		const mono = s[i];
		if (MONOGRAPHS[mono]) {
			result += MONOGRAPHS[mono];
			i += 1;
			continue;
		}

		// Fallback: output as-is (rare)
		result += s[i];
		i += 1;
	}

	// Normalize 'nn' or trailing 'n' to ん
	result = result.replace(/んん+/g, "ん");
	return result;
}
