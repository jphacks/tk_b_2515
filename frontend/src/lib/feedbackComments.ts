/**
 * スコアに基づいてまきのコメントを生成
 * TTSで正しく読み上げられるよう、難しい漢字は平仮名に変換
 */
export function getFeedbackComment(score: number): string {
  if (score >= 90) {
    const comments = [
      "すごいじゃん！完璧だよ！この調子でがんばってね！",
      "わぁ！すっごく上手になってるよ！天才じゃん！",
      "えっ、まじで！？こんなに高得点とれるなんて、努力してるね！",
      "やったね！この調子なら、だれとでもいい会話できるよ！",
    ];
    return comments[Math.floor(Math.random() * comments.length)];
  }

  if (score >= 75) {
    const comments = [
      "いいね！すごくいい感じだよ！もうちょっとで完璧！",
      "おぉ〜！上手になってきたね！すばらしいよ！",
      "やるじゃん！この調子で練習つづけてね！",
      "うんうん、すごくいいと思う！成長してるよ！",
    ];
    return comments[Math.floor(Math.random() * comments.length)];
  }

  if (score >= 60) {
    const comments = [
      "まぁまぁいい感じだね！もう少しがんばろう！",
      "わるくないよ！でも、まだまだのびしろあるから練習してね！",
      "うん、いい線いってる！次はもっと高得点めざそう！",
      "順調だね！この調子でつづければ、もっと上達するよ！",
    ];
    return comments[Math.floor(Math.random() * comments.length)];
  }

  if (score >= 40) {
    const comments = [
      "うーん、もうちょっとがんばろうか！練習あるのみだよ！",
      "まだまだこれからだね！一緒にがんばろう！",
      "大丈夫！練習すれば絶対上手になるから！",
      "ファイト！次はもっといいスコア出せるよ！",
    ];
    return comments[Math.floor(Math.random() * comments.length)];
  }

  // score < 40
  const comments = [
    "ドンマイ！落ちこまないで！次がんばろうね！",
    "大丈夫大丈夫！最初はみんなこんなもんだよ！練習しよ！",
    "まぁまぁ！あせらなくていいからね！少しずつ上達していこう！",
    "よしよし！まだ始まったばかりだから！一緒にがんばろうね！",
  ];
  return comments[Math.floor(Math.random() * comments.length)];
}
