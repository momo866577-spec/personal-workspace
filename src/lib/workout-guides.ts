import type { Workout } from "./types";

export type WorkoutGuide={platform:string;mark:string;title:string;url:string};

export function workoutGuides(workout:Pick<Workout,"bodyPart"|"exercise">):WorkoutGuide[]{
 const text=`${workout.bodyPart} ${workout.exercise}`.trim();
 const lower=text.toLowerCase();
 const kind=/胸|卧推|chest|push/.test(lower)?"chest":/腿|臀|leg|glute|squat/.test(lower)?"legs":/腹|核心|core|abs/.test(lower)?"core":/背|肩|上肢|back|shoulder|row/.test(lower)?"upper":"full";
 const fallback={chest:["胸部训练","Chest Workout"],legs:["腿部训练","Leg Workout"],core:["核心训练","Abs & Core Workout"],upper:["上肢训练","Upper Body Workout"],full:["全身训练","Full Body Workout"]}[kind];
 const chineseQuery=text||fallback[0];
 const pamelaQuery=/[a-z]/i.test(workout.exercise)?workout.exercise:fallback[1];
 return [
  {platform:"Keep",mark:"K",title:`搜索：${chineseQuery}`,url:`https://www.keep.com/search?keyword=${encodeURIComponent(chineseQuery)}`},
  {platform:"Pamela Reif",mark:"P",title:`搜索：${pamelaQuery}`,url:`https://www.youtube.com/results?search_query=${encodeURIComponent(`Pamela Reif ${pamelaQuery}`)}`},
  {platform:"周六野 Zoey",mark:"Z",title:`搜索：${chineseQuery}`,url:`https://www.youtube.com/results?search_query=${encodeURIComponent(`周六野 ${chineseQuery}`)}`},
 ];
}
