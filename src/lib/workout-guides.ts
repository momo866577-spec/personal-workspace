import type { Workout } from "./types";

export type WorkoutGuide={platform:string;mark:string;title:string;url:string};
export function workoutGuides(workout:Pick<Workout,"bodyPart"|"exercise">):WorkoutGuide[]{
 const text=`${workout.bodyPart} ${workout.exercise}`.toLowerCase(),kind=/胸|卧推|chest|push/.test(text)?"chest":/腿|臀|蹲|leg|glute|squat/.test(text)?"legs":/腹|核心|core|abs/.test(text)?"core":/背|肩|划船|back|shoulder|row/.test(text)?"upper":"full";
 const names={chest:["胸肌入门","Chest Workout","胸部塑形"],legs:["腿部燃脂","Leg Workout","腿部力量"],core:["核心入门","Abs & Core Workout","核心塑形"],upper:["上肢力量","Upper Body Workout","肩背塑形"],full:["全身燃脂","Full Body Workout","全身训练"]}[kind],queries=[`Keep ${names[0]}`,`Pamela Reif ${names[1]}`,`周六野 ${names[2]}`];
 return [{platform:"Keep",mark:"K",title:names[0],url:"https://www.keep.com/"},{platform:"Pamela Reif",mark:"P",title:names[1],url:`https://www.youtube.com/results?search_query=${encodeURIComponent(queries[1])}`},{platform:"周六野 Zoey",mark:"Z",title:names[2],url:`https://www.youtube.com/results?search_query=${encodeURIComponent(queries[2])}`}];
}
