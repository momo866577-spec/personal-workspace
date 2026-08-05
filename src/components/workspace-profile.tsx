"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import { Heart, ImagePlus, Trash2 } from "lucide-react";
import {
  DEFAULT_WORKSPACE_NAME,
  normalizeWorkspaceName,
  readWorkspaceProfile,
  saveWorkspaceProfile,
  WORKSPACE_NAME_MAX_LENGTH,
  WORKSPACE_PRESET_AVATARS,
  WORKSPACE_PROFILE_EVENT,
  type WorkspaceProfile,
} from "@/lib/workspace-profile";

export function useWorkspaceProfile() {
  const [profile, setProfile] = useState<WorkspaceProfile>({
    name: DEFAULT_WORKSPACE_NAME,
    avatar: "",
  });
  useEffect(() => {
    const sync = () => setProfile(readWorkspaceProfile());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(WORKSPACE_PROFILE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(WORKSPACE_PROFILE_EVENT, sync);
    };
  }, []);
  return profile;
}

async function compressAvatar(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("请选择图片文件");
  if (file.size > 8 * 1024 * 1024) throw new Error("图片不能超过 8 MB");
  const objectUrl = URL.createObjectURL(file);
  const source = new Image();
  source.src = objectUrl;
  try {
    await source.decode();
  } catch {
    URL.revokeObjectURL(objectUrl);
    throw new Error("无法读取这张图片，请改用 JPG、PNG 或 WebP");
  }
  const size = Math.min(source.naturalWidth, source.naturalHeight);
  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 320;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("浏览器无法处理这张图片");
  context.drawImage(
    source,
    Math.floor((source.naturalWidth - size) / 2),
    Math.floor((source.naturalHeight - size) / 2),
    size,
    size,
    0,
    0,
    320,
    320,
  );
  URL.revokeObjectURL(objectUrl);
  return canvas.toDataURL("image/webp", 0.84);
}

export function WorkspaceProfileSettings() {
  const current = useWorkspaceProfile();
  const [name, setName] = useState(current.name);
  const [avatar, setAvatar] = useState(current.avatar);
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Mirror changes made through the shared local profile event into the editor draft.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(current.name);
    setAvatar(current.avatar);
  }, [current.name, current.avatar]);

  const pickAvatar = async (file?: File) => {
    if (!file) return;
    setMessage("正在处理头像…");
    try {
      setAvatar(await compressAvatar(file));
      setMessage("头像已准备，点击保存后生效");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "头像处理失败");
    }
  };

  const save = () => {
    saveWorkspaceProfile({ name, avatar });
    setMessage("已保存到这台设备");
  };

  return (
    <section className="workspace-profile-settings setting-section" aria-labelledby="workspace-profile-title">
      <div className="profile-settings-copy">
        <p className="eyebrow">工作台个性化</p>
        <h3 id="workspace-profile-title">头像与名称</h3>
        <p>左上角只负责显示；所有修改都在这里完成，避免误触。</p>
      </div>

      <div className="profile-settings-grid">
        <div className="profile-avatar-editor">
          <div className="profile-avatar-preview" aria-label="当前头像预览">
            {avatar ? <img src={avatar} alt="工作台头像预览" /> : <Heart aria-hidden="true" />}
          </div>
          <input
            ref={inputRef}
            className="sr-only"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => void pickAvatar(event.target.files?.[0])}
          />
          <div className="profile-avatar-actions">
            <button type="button" className="glass-action" onClick={() => inputRef.current?.click()}>
              <ImagePlus aria-hidden="true" />
              {avatar ? "更换头像" : "上传头像"}
            </button>
            {avatar && (
              <button type="button" className="profile-remove-button" onClick={() => setAvatar("")}>
                <Trash2 aria-hidden="true" /> 删除
              </button>
            )}
          </div>
          <small>支持 JPG、PNG、WebP，自动裁成正方形并压缩。</small>
          <div className="profile-preset-picker" aria-label="预设头像">
            <span>或选择预设头像</span>
            <div>
              {WORKSPACE_PRESET_AVATARS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={avatar === preset.src ? "selected" : ""}
                  aria-label={`使用${preset.label}`}
                  aria-pressed={avatar === preset.src}
                  onClick={() => {
                    setAvatar(preset.src);
                    setMessage(`已选择${preset.label}，点击保存后生效`);
                  }}
                >
                  <img src={preset.src} alt="" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <label className="profile-name-editor">
          <span>工作台名称</span>
          <div>
            <input
              value={name}
              onChange={(event) => setName(normalizeWorkspaceName(event.target.value))}
              placeholder="例如：KK的工作台"
              aria-describedby="workspace-name-help"
            />
            <b>{Array.from(name).length}/{WORKSPACE_NAME_MAX_LENGTH}</b>
          </div>
          <small id="workspace-name-help">最多 8 个字；留空时头像下方不会显示名称或占位。</small>
        </label>
      </div>

      <div className="profile-settings-footer">
        <button type="button" className="glass-action" onClick={save}>保存个性化设置</button>
        <span role="status" aria-live="polite">{message}</span>
      </div>
    </section>
  );
}
