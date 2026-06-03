import fs from "node:fs";
import path from "node:path";

export type AvatarPresetCategoryId = "circle" | "memoji" | "pop-out";

export type AvatarPresetItem = {
  id: string;
  fileName: string;
  /** Public URL path, e.g. /avatars/Circle/Avatar%3D1.png */
  src: string;
};

export type AvatarPresetCategory = {
  id: AvatarPresetCategoryId;
  label: string;
  folder: string;
  items: AvatarPresetItem[];
};

const CATEGORY_CONFIG: {
  id: AvatarPresetCategoryId;
  label: string;
  folder: string;
}[] = [
  { id: "circle", label: "Circle", folder: "Circle" },
  { id: "memoji", label: "Memoji", folder: "Memoji" },
  { id: "pop-out", label: "Pop out", folder: "Pop-out" },
];

const IMAGE_EXT = /\.(png|jpe?g|webp|gif)$/i;

function sortAvatarFiles(a: string, b: string): number {
  const numA = Number.parseInt(a.match(/\d+/)?.[0] ?? "0", 10);
  const numB = Number.parseInt(b.match(/\d+/)?.[0] ?? "0", 10);
  if (numA !== numB) return numA - numB;
  return a.localeCompare(b, undefined, { numeric: true });
}

export function buildPresetSrc(folder: string, fileName: string): string {
  const encodedFolder = folder
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `/avatars/${encodedFolder}/${encodeURIComponent(fileName)}`;
}

function readPresetFolder(folder: string, categoryId: AvatarPresetCategoryId): AvatarPresetItem[] {
  const dir = path.join(process.cwd(), "public/avatars", folder);

  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs
    .readdirSync(dir)
    .filter((name) => IMAGE_EXT.test(name))
    .sort(sortAvatarFiles)
    .map((fileName) => ({
      id: `${categoryId}-${fileName}`,
      fileName,
      src: buildPresetSrc(folder, fileName),
    }));
}

/** Read preset avatars from `public/avatars` (server-only). */
export function getAvatarPresetCategories(): AvatarPresetCategory[] {
  return CATEGORY_CONFIG.map(({ id, label, folder }) => ({
    id,
    label,
    folder,
    items: readPresetFolder(folder, id),
  }));
}

export function isPresetAvatarUrl(
  url: string | null | undefined,
  categories: AvatarPresetCategory[],
): boolean {
  if (!url) return false;
  return categories.some((cat) => cat.items.some((item) => url === item.src || url.endsWith(item.src)));
}
