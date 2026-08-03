import Dexie, { type EntityTable } from "dexie";
import type { Contact, EnglishEntry, Note, Stream, Task, Workout } from "./types";

export class WorkspaceDB extends Dexie {
  tasks!: EntityTable<Task, "id">; english!: EntityTable<EnglishEntry, "id">;
  workouts!: EntityTable<Workout, "id">; notes!: EntityTable<Note, "id">;
  streams!: EntityTable<Stream, "id">; contacts!: EntityTable<Contact, "id">;
  constructor() {
    super("personal-workspace");
    this.version(1).stores({
      tasks: "id,due,done,order,createdAt", english: "id,date,completed,createdAt",
      workouts: "id,date,bodyPart,completed,createdAt", notes: "id,title,category,favorite,pinned,updatedAt,*tags",
      streams: "id,date,platform,streamer,createdAt", contacts: "id,username,platform,country,importance,createdAt,*tags",
    });
  }
}
export const db = new WorkspaceDB();

