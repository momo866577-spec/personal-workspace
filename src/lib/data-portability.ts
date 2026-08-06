import { db } from "./db";
export const allTableNames = [
  "tasks",
  "english",
  "workouts",
  "notes",
  "streams",
  "contacts",
  "workoutCheckins",
  "englishDailyPlans",
  "aiToolRecords",
  "englishQuestionBanks",
  "periodRecords",
  "giftRecords",
  "nutritionRecords",
  "nutritionFoods",
  "nutritionRecipes",
  "travelPlans",
] as const;
export async function exportAllData() {
  const data: Record<string, unknown> = {
    version: 7,
    exportedAt: new Date().toISOString(),
  };
  for (const name of allTableNames) data[name] = await db.table(name).toArray();
  return data;
}
export async function importAllData(value: Record<string, unknown>) {
  if (![1, 2, 3, 4, 5, 6, 7].includes(Number(value.version)))
    throw new Error("不支持的备份版本");
  const names = allTableNames.filter((name) => Array.isArray(value[name]));
  if (!allTableNames.slice(0, 6).every((name) => Array.isArray(value[name])))
    throw new Error("备份缺少原有数据表");
  await db.transaction("rw", db.tables, async () => {
    for (const name of names) {
      await db.table(name).clear();
      await db.table(name).bulkPut(value[name] as object[]);
    }
  });
}
