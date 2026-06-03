"use client";

import { useMemo, useState } from "react";

import { LazyPresetAvatar } from "@/components/profile/lazy-preset-avatar";
import type {
  AvatarPresetCategory,
  AvatarPresetCategoryId,
} from "@/lib/avatars/presets";
import { cn } from "@/lib/utils";
import { syncProfileAvatar } from "@/services/profile-actions";

type AvatarPresetPickerProps = {
  categories: AvatarPresetCategory[];
  selectedSrc?: string | null;
  disabled?: boolean;
  onSelect: (src: string) => void;
  onError: (message: string) => void;
};

export function AvatarPresetPicker({
  categories,
  selectedSrc,
  disabled = false,
  onSelect,
  onError,
}: AvatarPresetPickerProps) {
  const firstWithItems = categories.find((c) => c.items.length > 0)?.id ?? "circle";

  const [activeTab, setActiveTab] = useState<AvatarPresetCategoryId>(firstWithItems);
  const [savingId, setSavingId] = useState<string | null>(null);

  const activeCategory = useMemo(
    () => categories.find((c) => c.id === activeTab) ?? categories[0],
    [categories, activeTab],
  );

  async function handleSelect(itemId: string, src: string) {
    if (disabled || savingId) return;

    setSavingId(itemId);

    const result = await syncProfileAvatar(src);

    setSavingId(null);

    if (result.error) {
      onError(result.error);
      return;
    }

    onSelect(src);
  }

  const totalPresets = categories.reduce((n, c) => n + c.items.length, 0);

  if (totalPresets === 0) {
    return null;
  }

  return (
    <div className="w-full border-t border-border pt-4">
      <div className="mb-3 text-center">
        <p className="text-sm font-medium">Choose a preset</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Avatars load as you scroll — pick Circle, Memoji, or Pop out
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Avatar style"
        className="mb-3 flex gap-1 rounded-lg bg-muted/60 p-1"
      >
        {categories.map((category) => {
          const isActive = category.id === activeTab;
          const count = category.items.length;

          return (
            <button
              key={category.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              disabled={count === 0 || disabled}
              onClick={() => setActiveTab(category.id)}
              className={cn(
                "flex-1 rounded-md px-2 py-2 text-xs font-medium transition-colors sm:text-sm",
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
                count === 0 && "cursor-not-allowed opacity-40",
              )}
            >
              {category.label}
              {count > 0 && (
                <span className="ml-1 text-[10px] text-muted-foreground">({count})</span>
              )}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        aria-label={`${activeCategory?.label ?? ""} avatars`}
        className="max-h-56 overflow-y-auto overscroll-contain pr-1"
      >
        {activeCategory && activeCategory.items.length > 0 ? (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {activeCategory.items.map((item) => {
              const isSelected = selectedSrc === item.src;
              const isSaving = savingId === item.id;

              return (
                <LazyPresetAvatar
                  key={item.id}
                  src={item.src}
                  alt={`${activeCategory.label} avatar ${item.fileName}`}
                  variant={activeCategory.id}
                  selected={isSelected}
                  saving={isSaving}
                  disabled={disabled || (savingId !== null && !isSaving)}
                  onSelect={() => handleSelect(item.id, item.src)}
                />
              );
            })}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No avatars in this category yet.
          </p>
        )}
      </div>
    </div>
  );
}
