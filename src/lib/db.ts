import Dexie, { type EntityTable } from "dexie";
import type { AiConnection, AiSecret, AiToolRecord, Contact, EnglishDailyPlan, EnglishEntry, EnglishQuestionBank, Note, Stream, Task, Workout, WorkoutCheckin } from "./types";

export class WorkspaceDB extends Dexie {
  tasks!: EntityTable<Task, "id">; english!: EntityTable<EnglishEntry, "id">;
  workouts!: EntityTable<Workout, "id">; notes!: EntityTable<Note, "id">;
  streams!: EntityTable<Stream, "id">; contacts!: EntityTable<Contact, "id">;
  workoutCheckins!: EntityTable<WorkoutCheckin, "date">;
  englishDailyPlans!: EntityTable<EnglishDailyPlan, "date">;
  aiToolRecords!: EntityTable<AiToolRecord, "id">;
  englishQuestionBanks!: EntityTable<EnglishQuestionBank, "id">;
  aiConnections!: EntityTable<AiConnection, "id">;
  aiSecrets!: EntityTable<AiSecret, "id">;
  constructor() {
    super("personal-workspace");
    this.version(1).stores({
      tasks: "id,due,done,order,createdAt", english: "id,date,completed,createdAt",
      workouts: "id,date,bodyPart,completed,createdAt", notes: "id,title,category,favorite,pinned,updatedAt,*tags",
      streams: "id,date,platform,streamer,createdAt", contacts: "id,username,platform,country,importance,createdAt,*tags",
    });
    this.version(2).stores({
      tasks: "id,due,done,order,createdAt", english: "id,date,completed,createdAt",
      workouts: "id,date,bodyPart,completed,createdAt", notes: "id,title,category,favorite,pinned,updatedAt,*tags",
      streams: "id,date,platform,streamer,createdAt", contacts: "id,username,platform,country,importance,createdAt,*tags",
      workoutCheckins: "date,completed,completedAt", englishDailyPlans: "date,createdAt", aiToolRecords: "id,mode,createdAt",
    });
    this.version(3).stores({
      tasks: "id,due,done,order,createdAt", english: "id,date,completed,createdAt",
      workouts: "id,date,bodyPart,completed,createdAt", notes: "id,title,category,favorite,pinned,updatedAt,*tags",
      streams: "id,date,platform,streamer,createdAt", contacts: "id,username,platform,country,importance,createdAt,*tags",
      workoutCheckins: "date,completed,completedAt", englishDailyPlans: "date,createdAt,level", aiToolRecords: "id,mode,createdAt",
      englishQuestionBanks: "id,name,version,importedAt",
    });
    this.version(4).stores({
      tasks: "id,due,done,order,createdAt", english: "id,date,completed,createdAt",
      workouts: "id,date,bodyPart,completed,createdAt", notes: "id,title,category,favorite,pinned,updatedAt,*tags",
      streams: "id,date,platform,streamer,createdAt", contacts: "id,username,platform,country,importance,createdAt,*tags",
      workoutCheckins: "date,completed,completedAt", englishDailyPlans: "date,createdAt,level", aiToolRecords: "id,mode,createdAt",
      englishQuestionBanks: "id,name,version,importedAt", aiConnections:"id,provider,status,testedAt", aiSecrets:"id",
    });
  }
}
export const db = new WorkspaceDB();
