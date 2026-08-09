"use client";

import { createContext, useContext, useEffect, useState } from "react";

export const WORKSPACE_FONT_KEY = "personal-workspace-font-style";
export const WORKSPACE_TEXT_TONE_KEY = "personal-workspace-text-tone";

export const workspaceFonts = [
  { id: "system", name: "当前默认字体", note: "恢复工作台原来的字体" },
  { id: "resource-rounded", name: "资源圆体 Heavy", note: "圆润、厚实、可爱" },
  { id: "zcool-kuaile", name: "站酷快乐体", note: "活泼、轻松、手作感" },
  { id: "lxgw-wenkai", name: "霞鹜文楷 GB", note: "温柔、自然、书写感" },
  { id: "noto-bold", name: "Noto Sans SC Bold", note: "清晰、醒目、易阅读" },
  { id: "smiley", name: "得意黑", note: "个性、俏皮、标题感" },
] as const;

export type WorkspaceFont = (typeof workspaceFonts)[number]["id"];
export type WorkspaceTextTone = "theme" | "black";

type FontContextValue = {
  font: WorkspaceFont;
  setFont: (font: WorkspaceFont) => void;
  textTone: WorkspaceTextTone;
  setTextTone: (tone: WorkspaceTextTone) => void;
};

const FontContext = createContext<FontContextValue | null>(null);

function isWorkspaceFont(value: string | null): value is WorkspaceFont {
  return workspaceFonts.some((font) => font.id === value);
}

function isWorkspaceTextTone(value: string | null): value is WorkspaceTextTone {
  return value === "theme" || value === "black";
}

export function WorkspaceFontProvider({ children }: { children: React.ReactNode }) {
  const [font, setFontState] = useState<WorkspaceFont>("system");
  const [textTone, setTextToneState] = useState<WorkspaceTextTone>("theme");

  useEffect(() => {
    const stored = window.localStorage.getItem(WORKSPACE_FONT_KEY);
    const initial = isWorkspaceFont(stored) ? stored : "system";
    const storedTextTone = window.localStorage.getItem(WORKSPACE_TEXT_TONE_KEY);
    const initialTextTone = isWorkspaceTextTone(storedTextTone) ? storedTextTone : "theme";
    const frame = window.requestAnimationFrame(() => {
      setFontState(initial);
      setTextToneState(initialTextTone);
      document.documentElement.dataset.workspaceFont = initial;
      document.documentElement.dataset.workspaceTextTone = initialTextTone;
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const setFont = (next: WorkspaceFont) => {
    setFontState(next);
    window.localStorage.setItem(WORKSPACE_FONT_KEY, next);
    document.documentElement.dataset.workspaceFont = next;
  };

  const setTextTone = (next: WorkspaceTextTone) => {
    setTextToneState(next);
    window.localStorage.setItem(WORKSPACE_TEXT_TONE_KEY, next);
    document.documentElement.dataset.workspaceTextTone = next;
  };

  return <FontContext.Provider value={{ font, setFont, textTone, setTextTone }}>{children}</FontContext.Provider>;
}

export function useWorkspaceFont() {
  const value = useContext(FontContext);
  if (!value) throw new Error("useWorkspaceFont must be used inside WorkspaceFontProvider");
  return value;
}

export function WorkspaceFontSettings() {
  const { font, setFont, textTone, setTextTone } = useWorkspaceFont();
  const [fontDraft, setFontDraft] = useState<WorkspaceFont | null>(null);
  const [textToneDraft, setTextToneDraft] = useState<WorkspaceTextTone | null>(null);
  const [status, setStatus] = useState("");
  const [toneStatus, setToneStatus] = useState("");
  const pendingFont = fontDraft ?? font;
  const pendingTextTone = textToneDraft ?? textTone;

  const saveFont = () => {
    setFont(pendingFont);
    setFontDraft(null);
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
              setFontDraft(option.id);
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

      <div className="workspace-text-tone-divider" />
      <div className="profile-settings-copy">
        <p className="eyebrow">文字颜色</p>
        <h3>选择全站文字颜色</h3>
        <p>可保留现在的粉色文字，或切换成柔和黑色。按钮白字、图标、状态提示和图表颜色不会被改变。</p>
      </div>
      <div className="workspace-text-tone-grid" role="radiogroup" aria-label="选择全站文字颜色">
        <button
          type="button"
          role="radio"
          aria-checked={pendingTextTone === "theme"}
          className={`workspace-text-tone-option tone-preview-theme${pendingTextTone === "theme" ? " selected" : ""}`}
          onClick={() => {
            setTextToneDraft("theme");
            setToneStatus("");
          }}
        >
          <span>今日工作台</span>
          <b>当前主题色</b>
          <small>沿用现在的粉色文字</small>
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={pendingTextTone === "black"}
          className={`workspace-text-tone-option tone-preview-black${pendingTextTone === "black" ? " selected" : ""}`}
          onClick={() => {
            setTextToneDraft("black");
            setToneStatus("");
          }}
        >
          <span>今日工作台</span>
          <b>柔和黑色</b>
          <small>提升长时间阅读的清晰度</small>
        </button>
      </div>
      <div className="workspace-font-actions">
        <button
          type="button"
          className="workspace-font-save"
          onClick={() => {
            setTextTone(pendingTextTone);
            setTextToneDraft(null);
            setToneStatus("文字颜色已保存");
          }}
          disabled={pendingTextTone === textTone}
        >
          保存文字颜色
        </button>
        <span role="status" aria-live="polite">{toneStatus}</span>
      </div>
    </section>
  );
}
