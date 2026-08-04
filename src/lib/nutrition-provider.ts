import type { NutritionFood } from "./types";
import { db } from "./db";
import { readSavedKey } from "./ai-connection";

export interface NutritionProvider {
  id: string;
  name: string;
  search(query: string): Promise<NutritionFood[]>;
}
const common: NutritionFood[] = [
  ["chicken", "鸡胸肉", 165, 31, 0, 3.6],
  ["rice", "白饭", 130, 2.7, 28, 0.3],
  ["sweet-potato", "地瓜", 86, 1.6, 20.1, 0.1],
  ["milk", "牛奶", 61, 3.2, 4.8, 3.3],
  ["egg", "鸡蛋", 143, 12.6, 0.7, 9.5],
  ["banana", "香蕉", 89, 1.1, 22.8, 0.3],
  ["broccoli", "花椰菜", 34, 2.8, 6.6, 0.4],
  ["tofu", "豆腐", 76, 8.1, 1.9, 4.8],
  ["salmon", "鲑鱼", 208, 20, 0, 13],
  ["oats", "燕麦", 389, 16.9, 66.3, 6.9],
].map(([id, name, kcal, protein, carbs, fat]) => ({
  id: String(id),
  name: String(name),
  servingGrams: 100,
  kcal: Number(kcal),
  protein: Number(protein),
  carbs: Number(carbs),
  fat: Number(fat),
  source: "USDA 标准值参考",
}));
export class LocalNutritionProvider implements NutritionProvider {
  id = "local-usda";
  name = "本机常用食物库";
  async search(query: string) {
    const q = query.trim().toLowerCase();
    return common.filter((x) => x.name.includes(q) || x.id.includes(q));
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
export async function searchFoods(query: string) {
  const results: NutritionFood[] = [];
  for (const provider of nutritionProviders) {
    try {
      results.push(...(await provider.search(query)));
    } catch {}
  }
  return Array.from(new Map(results.map((x) => [x.id, x])).values());
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
