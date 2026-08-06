import type { NutritionFood } from "./types";
import { db } from "./db";
import { readSavedKey } from "./ai-connection";

export interface NutritionProvider {
  id: string;
  name: string;
  search(query: string): Promise<NutritionFood[]>;
}
type CatalogRow = [string, string, string[], number, number, number, number];
const catalogRows: CatalogRow[] = [
  ["chicken-breast", "鸡胸肉", ["雞胸肉", "鸡肉", "chicken breast"], 165, 31, 0, 3.6],
  ["rice-white", "白米饭", ["白飯", "米饭", "白饭", "rice"], 130, 2.7, 28, 0.3],
  ["rice-brown", "糙米饭", ["糙米", "brown rice"], 123, 2.7, 25.6, 1],
  ["sweet-potato", "地瓜", ["红薯", "番薯", "sweet potato"], 86, 1.6, 20.1, 0.1],
  ["potato", "马铃薯", ["土豆", "洋芋", "potato"], 87, 1.9, 20.1, 0.1],
  ["milk", "全脂牛奶", ["牛奶", "鲜奶", "milk"], 61, 3.2, 4.8, 3.3],
  ["soy-milk", "无糖豆浆", ["豆浆", "豆奶", "soy milk"], 33, 2.9, 1.7, 1.6],
  ["egg", "鸡蛋", ["蛋", "水煮蛋", "egg"], 143, 12.6, 0.7, 9.5],
  ["banana", "香蕉", ["banana"], 89, 1.1, 22.8, 0.3],
  ["apple", "苹果", ["蘋果", "apple"], 52, 0.3, 13.8, 0.2],
  ["orange", "橙子", ["柳橙", "橘子", "orange"], 47, 0.9, 11.8, 0.1],
  ["broccoli", "西兰花", ["花椰菜", "青花菜", "broccoli"], 34, 2.8, 6.6, 0.4],
  ["spinach", "菠菜", ["spinach"], 23, 2.9, 3.6, 0.4],
  ["cabbage", "高丽菜", ["卷心菜", "包菜", "cabbage"], 25, 1.3, 5.8, 0.1],
  ["tofu", "板豆腐", ["豆腐", "tofu"], 76, 8.1, 1.9, 4.8],
  ["salmon", "鲑鱼", ["三文鱼", "鮭魚", "salmon"], 208, 20, 0, 13],
  ["tuna", "金枪鱼", ["鮪魚", "吞拿鱼", "tuna"], 132, 28, 0, 1.3],
  ["shrimp", "虾仁", ["虾", "蝦仁", "shrimp"], 99, 24, 0.2, 0.3],
  ["pork-loin", "猪里脊", ["里肌肉", "猪肉", "pork loin"], 143, 26, 0, 3.5],
  ["beef", "瘦牛肉", ["牛肉", "beef"], 250, 26, 0, 15],
  ["oats", "燕麦片", ["燕麦", "麦片", "oats"], 379, 13.2, 67.7, 6.5],
  ["bread-whole", "全麦面包", ["全麥吐司", "全麦吐司", "whole wheat bread"], 247, 13, 41, 4.2],
  ["noodles", "熟面条", ["面条", "麵條", "noodles"], 138, 4.5, 25, 2.1],
  ["corn", "玉米", ["甜玉米", "corn"], 96, 3.4, 21, 1.5],
  ["avocado", "牛油果", ["酪梨", "avocado"], 160, 2, 8.5, 14.7],
  ["yogurt", "原味酸奶", ["优格", "優格", "酸奶", "yogurt"], 61, 3.5, 4.7, 3.3],
  ["almonds", "杏仁", ["扁桃仁", "almond"], 579, 21.2, 21.6, 49.9],
  ["peanuts", "花生", ["peanut"], 567, 25.8, 16.1, 49.2],
  ["edamame", "毛豆", ["枝豆", "edamame"], 121, 11.9, 8.9, 5.2],
  ["pumpkin", "南瓜", ["pumpkin"], 26, 1, 6.5, 0.1],
  ["mushroom", "蘑菇", ["香菇", "菇", "mushroom"], 22, 3.1, 3.3, 0.3],
  ["cucumber", "黄瓜", ["小黄瓜", "cucumber"], 15, 0.7, 3.6, 0.1],
];
export const bundledNutritionCatalog: NutritionFood[] = catalogRows.map(([id, name, aliases, kcal, protein, carbs, fat]) => ({
  id: `usda-local:${id}`, name, aliases, servingGrams: 100, kcal, protein, carbs, fat,
  source: "USDA FoodData Central", category: "基础食材", sourceRef: "https://fdc.nal.usda.gov/",
}));
export async function ensureNutritionCatalog() {
  if (!db.isOpen()) await db.open();
  if (await db.nutritionFoods.count()) return;
  await db.nutritionFoods.bulkPut(bundledNutritionCatalog);
}
export class LocalNutritionProvider implements NutritionProvider {
  id = "local-usda";
  name = "本机 USDA 食物库";
  async search(query: string) {
    const q = query.trim().toLowerCase();
    await ensureNutritionCatalog();
    if (!q) return [];
    const foods = await db.nutritionFoods.toArray();
    return foods.filter((x) => [x.name, x.brand || "", ...(x.aliases || [])].some((term) => term.toLowerCase().includes(q)));
  }
}
export class OpenFoodFactsProvider implements NutritionProvider {
  id = "open-food-facts";
  name = "Open Food Facts";
  async search(query: string) {
    if (!query.trim()) return [];
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=12&fields=code,product_name,brands,nutriments`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("食物数据库暂时无法连接");
    const data = (await response.json()) as {
      products?: Array<{
        code?: string;
        product_name?: string;
        brands?: string;
        nutriments?: Record<string, number>;
      }>;
    };
    return (data.products || [])
      .filter((x) => x.product_name)
      .map((x) => ({
        id: `off:${x.code}`,
        name: x.product_name!,
        brand: x.brands,
        servingGrams: 100,
        kcal: Number(x.nutriments?.["energy-kcal_100g"] || 0),
        protein: Number(x.nutriments?.proteins_100g || 0),
        carbs: Number(x.nutriments?.carbohydrates_100g || 0),
        fat: Number(x.nutriments?.fat_100g || 0),
        source: "Open Food Facts",
      }))
      .filter((x) => x.kcal > 0);
  }
}
export class UsdaNutritionProvider implements NutritionProvider {
  id = "usda-food-data-central";
  name = "USDA FoodData Central";
  constructor(private apiKey: string) {}
  async search(query: string) {
    if (!this.apiKey || !query.trim()) return [];
    const response = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${encodeURIComponent(this.apiKey)}&query=${encodeURIComponent(query)}&pageSize=12`,
    );
    if (!response.ok)
      throw new Error(`USDA 查询失败（HTTP ${response.status}）`);
    const data = (await response.json()) as {
      foods?: Array<{
        fdcId: number;
        description: string;
        brandOwner?: string;
        foodNutrients?: Array<{ nutrientName: string; value: number }>;
      }>;
    };
    return (data.foods || []).map((food) => {
      const nutrients = new Map(
        (food.foodNutrients || []).map((entry) => [
          entry.nutrientName,
          entry.value,
        ]),
      );
      return {
        id: `usda:${food.fdcId}`,
        name: food.description,
        brand: food.brandOwner,
        servingGrams: 100,
        kcal: Number(nutrients.get("Energy") || 0),
        protein: Number(nutrients.get("Protein") || 0),
        carbs: Number(nutrients.get("Carbohydrate, by difference") || 0),
        fat: Number(nutrients.get("Total lipid (fat)") || 0),
        source: "USDA FoodData Central",
      } satisfies NutritionFood;
    });
  }
}

export class EdamamNutritionProvider implements NutritionProvider {
  id = "edamam-food-database";
  name = "Edamam Food Database";
  constructor(
    private appId: string,
    private appKey: string,
  ) {}
  async search(query: string) {
    if (!this.appId || !this.appKey || !query.trim()) return [];
    const response = await fetch(
      `https://api.edamam.com/api/food-database/v2/parser?app_id=${encodeURIComponent(this.appId)}&app_key=${encodeURIComponent(this.appKey)}&ingr=${encodeURIComponent(query)}`,
    );
    if (!response.ok)
      throw new Error(`Edamam 查询失败（HTTP ${response.status}）`);
    const data = (await response.json()) as {
      hints?: Array<{
        food: {
          foodId: string;
          label: string;
          brand?: string;
          nutrients: {
            ENERC_KCAL?: number;
            PROCNT?: number;
            CHOCDF?: number;
            FAT?: number;
          };
        };
      }>;
    };
    return (data.hints || []).slice(0, 12).map(({ food }) => ({
      id: `edamam:${food.foodId}`,
      name: food.label,
      brand: food.brand,
      servingGrams: 100,
      kcal: Number(food.nutrients.ENERC_KCAL || 0),
      protein: Number(food.nutrients.PROCNT || 0),
      carbs: Number(food.nutrients.CHOCDF || 0),
      fat: Number(food.nutrients.FAT || 0),
      source: "Edamam Food Database",
    }));
  }
}

export const nutritionProviders: NutritionProvider[] = [
  new LocalNutritionProvider(),
  new OpenFoodFactsProvider(),
];
export type NutritionSearchResult = { foods: NutritionFood[]; warnings: string[] };
export async function searchFoodsWithStatus(query: string): Promise<NutritionSearchResult> {
  const local = await nutritionProviders[0].search(query);
  if (local.length) return { foods: local, warnings: [] };
  const results: NutritionFood[] = [];
  const warnings: string[] = [];
  for (const provider of nutritionProviders.slice(1)) {
    try {
      results.push(...(await provider.search(query)));
    } catch (error) {
      warnings.push(`${provider.name}：${error instanceof Error ? error.message : "查询失败"}`);
    }
  }
  return { foods: Array.from(new Map(results.map((x) => [x.id, x])).values()), warnings };
}
export async function searchFoods(query: string) {
  return (await searchFoodsWithStatus(query)).foods;
}
export async function rememberNutritionFood(food: NutritionFood) {
  await db.nutritionFoods.put({ ...food, category: food.category || (food.source === "Open Food Facts" ? "包装食品" : "自定义") });
}
export function scaleFood(food: NutritionFood, grams: number) {
  const ratio = grams / food.servingGrams;
  return {
    kcal: food.kcal * ratio,
    protein: food.protein * ratio,
    carbs: food.carbs * ratio,
    fat: food.fat * ratio,
  };
}
export async function recognizeFoodCandidates(dataUrl: string) {
  const connection = await db.aiConnections.get("active"),
    key = await readSavedKey();
  if (!connection || !key)
    throw new Error("请先到设置 → AI 中心连接支持图片的模型");
  const [meta, base64] = dataUrl.split(","),
    mime = meta.match(/data:(.*?);/)?.[1] || "image/jpeg",
    prompt =
      '只识别图片中可能的食物名称，不估算营养。只返回JSON，例如 {"foods":["鸡胸肉","白饭"]}';
  let response: Response;
  const base = connection.baseUrl.replace(/\/$/, "");
  if (connection.provider === "gemini")
    response = await fetch(
      `${base}/models/${encodeURIComponent(connection.model)}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                { inline_data: { mime_type: mime, data: base64 } },
              ],
            },
          ],
          generationConfig: { responseMimeType: "application/json" },
        }),
      },
    );
  else if (connection.provider === "claude")
    response = await fetch(`${base}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: connection.model,
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: mime, data: base64 },
              },
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
    });
  else
    response = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: connection.model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        max_tokens: 300,
        response_format: { type: "json_object" },
      }),
    });
  if (!response.ok)
    throw new Error(
      `图片识别失败（HTTP ${response.status}），请确认当前模型支持图片`,
    );
  const raw = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    content?: { text?: string }[];
  };
  const text =
    raw.choices?.[0]?.message?.content ||
    raw.candidates?.[0]?.content?.parts?.map((x) => x.text || "").join("") ||
    raw.content?.map((x) => x.text || "").join("") ||
    "";
  const parsed = JSON.parse(text.replace(/^```json\s*|\s*```$/g, "")) as {
    foods?: string[];
  };
  return (parsed.foods || []).slice(0, 6);
}
