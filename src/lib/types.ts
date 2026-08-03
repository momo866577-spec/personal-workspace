export type Id = string;
export type Task = { id: Id; title: string; due: string; done: boolean; order: number; createdAt: string };
export type EnglishEntry = { id: Id; date: string; word: string; sentence: string; grammar: string; reading: string; speaking: string; listening: string; completed: boolean; createdAt: string };
export type Workout = { id: Id; date: string; bodyPart: string; exercise: string; sets: number; weight: number; reps: number; minutes: number; photo?: string; completed: boolean; createdAt: string };
export type Note = { id: Id; title: string; content: string; category: string; tags: string[]; favorite: boolean; pinned: boolean; files: { name: string; data: string }[]; createdAt: string; updatedAt: string };
export type Stream = { id: Id; date: string; platform: string; streamer: string; submission: string; mentioned: boolean; thoughts: string; review: string; improvements: string; rating: number; createdAt: string };
export type Contact = { id: Id; username: string; platform: string; country: string; interests: string; birthday: string; chats: string; notes: string; tags: string[]; importance: number; createdAt: string };
export type TableName = "tasks" | "english" | "workouts" | "notes" | "streams" | "contacts";
export type RecordMap = { tasks: Task; english: EnglishEntry; workouts: Workout; notes: Note; streams: Stream; contacts: Contact };
export const uid = () => crypto.randomUUID();
export const today = () => new Date().toLocaleDateString("en-CA");

