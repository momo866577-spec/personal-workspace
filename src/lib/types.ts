export type Id = string;
export type Task = {
  id: Id;
  title: string;
  due: string;
  done: boolean;
  order: number;
  createdAt: string;
};
export type EnglishEntry = {
  id: Id;
  date: string;
  word: string;
  sentence: string;
  grammar: string;
  reading: string;
  speaking: string;
  listening: string;
  completed: boolean;
  createdAt: string;
};
export type Workout = {
  id: Id;
  date: string;
  bodyPart: string;
  exercise: string;
  sets: number;
  weight: number;
  reps: number;
  minutes: number;
  photo?: string;
  completed: boolean;
  createdAt: string;
};
export type Note = {
  id: Id;
  title: string;
  content: string;
  category: string;
  tags: string[];
  favorite: boolean;
  pinned: boolean;
  files: { name: string; data: string }[];
  createdAt: string;
  updatedAt: string;
};
export type Stream = {
  id: Id;
  date: string;
  platform: string;
  streamer: string;
  submission: string;
  mentioned: boolean;
  thoughts: string;
  review: string;
  improvements: string;
  rating: number;
  createdAt: string;
};
export type Contact = {
  id: Id;
  username: string;
  platform: string;
  country: string;
  interests: string | string[];
  birthday: string;
  chats: string;
  notes: string;
  tags: string[];
  importance: number;
  createdAt: string;
  age?: number;
  profession?: string;
  traits?: string[];
};
export type WorkoutCheckin = {
  date: string;
  completed: boolean;
  completedAt: string;
};
export type PeriodFlow = "spotting" | "light" | "medium" | "heavy";
export type PeriodRecord = {
  id: Id;
  startDate: string;
  endDate?: string;
  flow: PeriodFlow;
  padChanges: number;
  pain: number;
  color: string;
  symptoms: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
};
export type GiftSource =
  "manual" | "bilibili" | "douyin" | "kuaishou" | "youtube" | "twitch";
export type GiftRecord = {
  id: Id;
  date: string;
  time: string;
  platform: string;
  room: string;
  username: string;
  giftName: string;
  quantity: number;
  unitValue: number;
  notes: string;
  tags: string[];
  source: GiftSource;
  createdAt: string;
  updatedAt: string;
};
export type NutritionFood = {
  id: string;
  name: string;
  brand?: string;
  servingGrams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  source: string;
  aliases?: string[];
  category?: "基础食材" | "包装食品" | "自定义";
  sourceRef?: string;
};
export type NutritionRecipe = {
  id: Id;
  name: string;
  aliases: string[];
  ingredients: Array<{ foodId: string; foodName: string; grams: number }>;
  servingGrams: number;
  createdAt: string;
  updatedAt: string;
};
export type NutritionRecord = {
  id: Id;
  date: string;
  meal: "早餐" | "午餐" | "晚餐" | "加餐";
  foodId: string;
  foodName: string;
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  source: string;
  notes: string;
  createdAt: string;
};
export type TravelItem = {
  id: Id;
  period: "上午" | "下午" | "晚上";
  time: string;
  name: string;
  category: string;
  address: string;
  duration: number;
  cost: number;
  notes: string;
  favorite: boolean;
  order: number;
};
export type TravelPlan = {
  id: Id;
  title: string;
  destination: string;
  startDate: string;
  days: number;
  budget: number;
  people: number;
  transport: string;
  cover?: string;
  status: "draft" | "planned";
  items: Record<string, TravelItem[]>;
  expenses: {
    accommodation: number;
    transport: number;
    food: number;
    tickets: number;
    other: number;
  };
  tips: string[];
  documents: { type: string; name: string; note: string }[];
  photos: { name: string; data: string }[];
  createdAt: string;
  updatedAt: string;
};
export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
export type EnglishDailyItemKind =
  "words" | "sentences" | "shadowing" | "speaking" | "listening";
export type EnglishPrompt = {
  text: string;
  translation?: string;
  phonetic?: string;
  example?: string;
  exampleTranslation?: string;
};
export type EnglishDailyItem = {
  kind: EnglishDailyItemKind;
  title: string;
  detail: string;
  taskId: string;
  prompts?: EnglishPrompt[];
};
export type EnglishDailyPlan = {
  date: string;
  items: EnglishDailyItem[];
  createdAt: string;
  level?: CefrLevel;
  bankVersion?: string;
  source?: string;
};
export type EnglishLesson = {
  id: string;
  level: CefrLevel;
  words: EnglishPrompt[];
  sentences: EnglishPrompt[];
  shadowing: EnglishPrompt;
  speaking: EnglishPrompt;
  listening: EnglishPrompt;
};
export type EnglishQuestionBank = {
  id: string;
  name: string;
  version: string;
  source: string;
  lessons: EnglishLesson[];
  importedAt: string;
};
export type AiToolMode = "reply" | "review" | "coach";
export type AiToolRecord = {
  id: Id;
  mode: AiToolMode;
  input: string;
  output: string;
  provider: string;
  createdAt: string;
  favorite?: boolean;
  style?: string;
};
export type AiProviderId =
  "deepseek" | "doubao" | "openai" | "gemini" | "claude" | "openai-compatible";
export type AiConnection = {
  id: "active";
  provider: AiProviderId;
  model: string;
  baseUrl: string;
  status: "connected" | "error";
  testedAt: string;
  error?: string;
};
export type AiSecret = {
  id: "active";
  key: CryptoKey;
  cipher: ArrayBuffer;
  iv: Uint8Array<ArrayBuffer>;
};
export type TableName =
  | "tasks"
  | "english"
  | "workouts"
  | "notes"
  | "streams"
  | "contacts"
  | "workoutCheckins"
  | "englishDailyPlans"
  | "aiToolRecords"
  | "englishQuestionBanks"
  | "periodRecords"
  | "giftRecords"
  | "nutritionRecords"
  | "nutritionFoods"
  | "nutritionRecipes"
  | "travelPlans";
export type RecordMap = {
  tasks: Task;
  english: EnglishEntry;
  workouts: Workout;
  notes: Note;
  streams: Stream;
  contacts: Contact;
  workoutCheckins: WorkoutCheckin;
  englishDailyPlans: EnglishDailyPlan;
  aiToolRecords: AiToolRecord;
  englishQuestionBanks: EnglishQuestionBank;
  periodRecords: PeriodRecord;
  giftRecords: GiftRecord;
  nutritionRecords: NutritionRecord;
  nutritionFoods: NutritionFood;
  nutritionRecipes: NutritionRecipe;
  travelPlans: TravelPlan;
};
export const uid = () => crypto.randomUUID();
export const today = () => new Date().toLocaleDateString("en-CA");
