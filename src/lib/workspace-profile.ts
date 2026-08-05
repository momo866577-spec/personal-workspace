export const WORKSPACE_NAME_MAX_LENGTH = 8;
export const DEFAULT_WORKSPACE_NAME = "";

export const WORKSPACE_PRESET_AVATARS = [
  { id: "star-girl", label: "蓝发星光少女", src: "/profile-avatars/star-girl.webp" },
  { id: "crystal-blossom", label: "水晶樱花爱心", src: "/profile-avatars/crystal-blossom.webp" },
  { id: "cloud-spirit", label: "皇冠云朵精灵", src: "/profile-avatars/cloud-spirit.webp" },
  { id: "crystal-swan", label: "粉色水晶天鹅", src: "/profile-avatars/crystal-swan.webp" },
  { id: "blossom-planet", label: "樱花水晶小星球", src: "/profile-avatars/blossom-planet.webp" },
] as const;

export type WorkspaceProfile = {
  name: string;
  avatar: string;
};

const NAME_KEY = "personal-workspace-profile-name";
const AVATAR_KEY = "personal-workspace-profile-avatar";
export const WORKSPACE_PROFILE_EVENT = "workspace-profile-changed";

export function normalizeWorkspaceName(value: string) {
  return Array.from(value.trim()).slice(0, WORKSPACE_NAME_MAX_LENGTH).join("");
}

export function readWorkspaceProfile(): WorkspaceProfile {
  if (typeof window === "undefined") {
    return { name: DEFAULT_WORKSPACE_NAME, avatar: "" };
  }
  return {
    name: normalizeWorkspaceName(localStorage.getItem(NAME_KEY) || ""),
    avatar: localStorage.getItem(AVATAR_KEY) || "",
  };
}

export function saveWorkspaceProfile(profile: WorkspaceProfile) {
  const name = normalizeWorkspaceName(profile.name);
  if (name) localStorage.setItem(NAME_KEY, name);
  else localStorage.removeItem(NAME_KEY);
  if (profile.avatar) localStorage.setItem(AVATAR_KEY, profile.avatar);
  else localStorage.removeItem(AVATAR_KEY);
  window.dispatchEvent(new CustomEvent(WORKSPACE_PROFILE_EVENT));
}
