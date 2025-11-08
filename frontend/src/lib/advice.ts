export type BackgroundKey = "library" | "classroom" | "xmas";

export type AdviceItem = {
  id: string;
  label: string;
  // ユーザー発話に対するマッチ条件（いずれかがヒットすれば達成）
  patterns: RegExp[];
};

export const BACKGROUND_ADVICE: Record<BackgroundKey, AdviceItem[]> = {
  library: [
    {
      id: "library_visit_question",
      label: "初めましての挨拶をする",
      patterns: [
        /はじめまして|初めまして|初めてまして/i,
        /よろしく(お願いします|ね)?/i,
      ],
    },
    {
      id: "study_topic",
      label: "勉強や授業の話題を出す",
      patterns: [/勉強|授業|講義|単位|履修|ゼミ|レポート|課題|教科/i],
    },
    {
      id: "open_question",
      label: "女の子が答えやすいオープンな質問を投げる",
      patterns: [/なんで|どうして|どう思う|どんな|おすすめ|理由|きっかけ/i],
    },
  ],
  classroom: [
    {
      id: "class_topic",
      label: "授業・課題・サークルなど身近な話題を出す",
      patterns: [/授業|課題|テスト|サークル|部活|先生|教室|放課後/i],
    },
    {
      id: "weekend_plan",
      label: "週末や放課後の軽い予定提案/質問をする",
      patterns: [/週末|土日|放課後|今度|行かない|行こう|空いてる|予定/i],
    },
    {
      id: "follow_up_question",
      label: "相手発言に具体的な掘り下げ質問（いつ/どこ/どれくらい 等）",
      patterns: [/それって|例えば|具体的に|どれくらい|いつ(から|頃)|なんの|どこで|どこに/i],
    },
  ],
  xmas: [
    {
      id: "xmas_topic",
      label: "冬/クリスマスの話題（イルミ・プレゼント・予定）",
      patterns: [/クリスマス|イルミ|冬|プレゼント|サンタ|年末|初詣|ケーキ/i],
    },
    {
      id: "positive_mood",
      label: "明るく前向きなリアクションを返す",
      patterns: [/いいね|楽しみ|うれしい|ワクワク|最高|素敵|かわいい|綺麗/i],
    },
    {
      id: "suggest_plan",
      label: "軽い提案（見に行く/写真/カフェ等）をする",
      patterns: [/見に行|写真|撮ろ|カフェ|行こう|寄ろう|一緒に|観に行/i],
    },
  ],
};
