# Personal Workspace

手機優先、離線優先的個人工作台。所有內容預設保存在瀏覽器 IndexedDB，設定保存在 LocalStorage，不依賴雲端服務。

## 執行

```bash
npm install
npm run dev
```

開啟 `http://localhost:3000`。在支援 PWA 的瀏覽器中，可使用瀏覽器選單「安裝應用程式」加入桌面或手機主畫面。

正式建置：

```bash
npm run lint
npm run build
npm start
```

## 功能

- Dashboard、每日計畫（含拖曳排序）、英語學習與連續打卡
- 運動紀錄、照片與訓練量圖表
- Markdown 備忘錄、分類、標籤、收藏、置頂與附件
- 直播投稿／覆盤與直播用戶 CRM
- 五套介面風格、深淺色模式、字級、完整 JSON 匯入／匯出與清除資料
- 響應式桌面側欄與手機底部導覽、PWA 離線快取

## 介面風格

「設定 → 介面風格」提供 Minimal Light、Midnight Pro、Glass Flow、Warm Journal 與 Focus Compact。每套風格都有獨立的色彩、背景、卡片、陰影、圓角、導覽、密度與動畫 Token，且能與淺色／深色模式及字體大小自由組合。

風格選擇儲存在 LocalStorage 的 `workspace-interface-theme`，不會寫入或改動 IndexedDB。

## 如何替換 App 圖標

所有圖標集中在 `public/icons`。日後只需要：

1. 準備一張正方形 PNG，建議為 `1024 × 1024` 或更大。
2. 圖像主體請放在中央約 60%～66% 區域，四周保留安全邊距。
3. 用新圖片覆蓋 `public/icons/icon-source.png`，檔名保持不變。
4. 執行 `npm run build`。`prebuild` 會自動產生所有 Android、iPhone 與瀏覽器圖標。

也可以只產生圖標而不建置：

```bash
npm run icons
```

自動生成的檔案包括：

- `icon-192.png`、`icon-512.png`：標準 PWA 圖標
- `icon-maskable-192.png`、`icon-maskable-512.png`：Android Maskable 圖標，來源圖會縮入中央 64% 安全區
- `apple-touch-icon.png`：iPhone／iPad 主畫面圖標
- `favicon-32.png`：瀏覽器分頁圖標

Manifest 與 Next.js metadata 固定指向上述檔名，因此替換來源圖後不需要修改任何程式檔案。若裝置仍顯示舊圖，請先解除安裝舊 PWA、清除該網站快取，再重新安裝。

## 資料與隱私

資料不會自動離開此裝置。瀏覽器資料被清除時，IndexedDB 內容也會消失，建議定期在「設定」匯出 JSON 備份。匯入備份會取代目前全部資料。
