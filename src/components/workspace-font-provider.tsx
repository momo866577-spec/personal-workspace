"use client";

import { createContext, useContext, useEffect, useState } from "react";

export const WORKSPACE_FONT_KEY = "personal-workspace-font-style";

export const workspaceFonts = [
  { id: "system", name: "当前默认字体", note: "恢复工作台原来的字体" },
  { id: "resource-rounded", name: "资源圆体 Heavy", note: "圆润、厚实、可爱" },
  { id: "zcool-kuaile", name: "站酷快乐体", note: "活泼、轻松、手作感" },
  { id: "lxgw-wenkai", name: "霞鹜文楷 GB", note: "温柔、自然、书写感" },
  { id: "noto-bold", name: "Noto Sans SC Bold", note: "清晰、醒目、易阅读" },
  { id: "smiley", name: "得意黑", note: "个性、俏皮、标题感" },
] as const;

export type WorkspaceFont = (typeof workspaceFonts)[number]["id"];

type FontContextValue = {
  font: WorkspaceFont;
  setFont: (font: WorkspaceFont) => void;
};

const FontContext = createContext<FontContextValue | null>(null);

function isWorkspaceFont(value: string | null): value is WorkspaceFont {
  return workspaceFonts.some((font) => font.id === value);
}

export function WorkspaceFontProvider({ children }: { children: React.ReactNode }) {
  const [font, setFontState] = useState<WorkspaceFont>("system");

  useEffect(() => {
    const stored = window.localStorage.getItem(WORKSPACE_FONT_KEY);
    const initial = isWorkspaceFont(stored) ? stored : "system";
    const frame = window.requestAnimationFrame(() => {
      setFontState(initial);
      document.documentElement.dataset.workspaceFont = initial;
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const setFont = (next: WorkspaceFont) => {
    setFontState(next);
    window.localStorage.setItem(WORKSPACE_FONT_KEY, next);
    document.documentElement.dataset.workspaceFont = next;
  };

  return <FontContext.Provider value={{ font, setFont }}>{children}</FontContext.Provider>;
}

export function useWorkspaceFont() {
  const value = useContext(FontContext);
  if (!value) throw new Error("useWorkspaceFont must be used inside WorkspaceFontProvider");
  return value;
}

export function WorkspaceFontSettings() {
  const { font, setFont } = useWorkspaceFont();
  const [pendingFont, setPendingFont] = useState<WorkspaceFont>(font);
  const [status, setStatus] = useState("");

  const saveFont = () => {
    setFont(pendingFont);
    setStatus("字体已保存");
  };

  return (
    <section className="workspace-font-settings setting-section" aria-labelledby="workspace-font-title">
      <div className="profile-settings-copy">
        <p className="eyebrow">字体外观</p>
        <h3 id="workspace-font-title">选择中文字体</h3>
        <p>只更换简体中文字体；英文字母和阿拉伯数字继续使用原字体，避免排版与乱码问题。</p>
      </div>
      <div className="workspace-font-grid" role="radiogroup" aria-label="选择中文字体">
        {workspaceFonts.map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={pendingFont === option.id}
            className={`workspace-font-option font-preview-${option.id}${pendingFont === option.id ? " selected" : ""}`}
            onClick={() => {
              setPendingFont(option.id);
              setStatus("");
            }}
          >
            <span className="workspace-font-sample">今日工作台</span>
            <b>{option.name}</b>
            <small>{option.note}</small>
            <em>ABC abc 0123456789</em>
          </button>
        ))}
      </div>
      <div className="workspace-font-actions">
        <button type="button" className="workspace-font-save" onClick={saveFont} disabled={pendingFont === font}>
          保存字体
        </button>
        <span role="status" aria-live="polite">{status}</span>
      </div>
      <p className="workspace-font-help">选择后点击“保存字体”才会套用并保存在本机。字体缺字时会自动回退到系统中文字体，不会显示乱码。</p>
    </section>
  );
}
