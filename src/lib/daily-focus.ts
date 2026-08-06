const dailyFocusMessages = [
  "先完成眼前的一小步，今天就已经开始不同。",
  "不用一次做到完美，持续推进就很了不起。",
  "把注意力放回当下，答案会在行动里出现。",
  "今天不必超越所有人，只要比昨天更靠近目标。",
  "允许自己慢一点，但别忘了继续往前。",
  "真正的进度，是把想做的事认真做完一点。",
  "先开始，再调整；行动会替你整理思绪。",
  "你不需要状态满分，也可以完成重要的事。",
  "把今天过扎实，就是给未来最好的准备。",
  "专注一个小目标，复杂的事情也会慢慢变清楚。",
  "休息不是停下，是为了带着能量继续前进。",
  "别急着否定自己，你正在积累看得见的改变。",
  "今天完成的一点点，会成为明天轻松一点的底气。",
  "先照顾好节奏，再把事情一件一件做好。",
  "不用等待灵感，动手之后灵感才有地方落下。",
  "把担心变成下一步，事情就会开始有方向。",
  "稳定地做，比偶尔拼尽全力更接近长期目标。",
  "你可以重新安排今天，不必被刚才的状态困住。",
  "给重要的事情一点安静，它会回报你清晰。",
  "完成比完美更有力量，先让结果发生。",
  "今天的耐心，会变成以后处理事情的从容。",
  "每次认真选择，都是在塑造你想要的生活。",
  "把目标缩小到现在能做的一步，然后去完成它。",
  "不必追赶别人的速度，你的节奏同样值得信任。",
  "当事情很多时，先做好最重要的那一件。",
  "你已经走过不少路，今天继续走一点就很好。",
  "专注不是做更多，而是让此刻只留下最重要的事。",
  "给自己一个清楚的开始，今天会更容易展开。",
  "情绪可以慢慢整理，行动也可以轻轻开始。",
  "认真完成今天，就是对理想生活最具体的回应。",
  "方向对了，小步前进也会累积成很远的路。",
];

const dateIndex = (dateKey: string) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
};

export const localDateKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export const getDailyFocusMessage = (dateKey = localDateKey()) =>
  dailyFocusMessages[((dateIndex(dateKey) % dailyFocusMessages.length) + dailyFocusMessages.length) % dailyFocusMessages.length];

export const dailyFocusMessageCount = dailyFocusMessages.length;
