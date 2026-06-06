"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

export type NavIconComponent = React.ComponentType<{
  className?: string;
  active?: boolean;
}>;

export interface InteractiveMenuItem {
  label: string;
  icon: NavIconComponent;
  href?: string;
}

export interface InteractiveMenuProps {
  items?: InteractiveMenuItem[];
  accentColor?: string;
  /** Controlled active tab index */
  activeIndex?: number;
  /** Uncontrolled initial index */
  defaultActiveIndex?: number;
  onItemChange?: (index: number, item: InteractiveMenuItem) => void;
  className?: string;
}

const defaultAccentColor = "var(--component-active-color-default)";

function InteractiveMenu({
  items,
  accentColor,
  activeIndex: controlledIndex,
  defaultActiveIndex = 0,
  onItemChange,
  className,
}: InteractiveMenuProps) {
  const finalItems = useMemo(() => {
    const isValid =
      items && Array.isArray(items) && items.length >= 2 && items.length <= 5;
    if (!isValid) {
      if (items !== undefined) {
        console.warn(
          "InteractiveMenu: 'items' must have 2–5 entries. Received:",
          items,
        );
      }
      return null;
    }
    return items;
  }, [items]);

  const [uncontrolledIndex, setUncontrolledIndex] = useState(defaultActiveIndex);
  const isControlled = controlledIndex !== undefined;
  const activeIndex = isControlled ? controlledIndex : uncontrolledIndex;

  useEffect(() => {
    if (finalItems && activeIndex >= finalItems.length) {
      if (!isControlled) {
        setUncontrolledIndex(0);
      }
    }
  }, [finalItems, activeIndex, isControlled]);

  const handleItemClick = (index: number, item: InteractiveMenuItem) => {
    if (!finalItems) return;
    if (item.href) return;
    if (!isControlled) {
      setUncontrolledIndex(index);
    }
    onItemChange?.(index, item);
  };

  const navStyle = useMemo(() => {
    const activeColor = accentColor || defaultAccentColor;
    return { "--component-active-color": activeColor } as React.CSSProperties;
  }, [accentColor]);

  if (!finalItems) {
    return null;
  }

  return (
    <nav
      className={className ? `menu ${className}` : "menu"}
      role="navigation"
      aria-label="Main navigation"
      style={navStyle}
    >
      {finalItems.map((item, index) => {
        const isActive = index === activeIndex;
        const IconComponent = item.icon;

        const itemClassName = `menu__item ${isActive ? "active" : ""}`;
        const itemContent = (
          <>
            <div className="menu__icon" aria-hidden="true">
              <IconComponent className="icon" active={isActive} />
            </div>
            <strong className={`menu__text ${isActive ? "active" : ""}`}>
              {item.label}
            </strong>
          </>
        );

        if (item.href) {
          return (
            <Link
              key={item.label}
              href={item.href}
              prefetch
              className={itemClassName}
              aria-current={isActive ? "page" : undefined}
              onClick={() => handleItemClick(index, item)}
            >
              {itemContent}
            </Link>
          );
        }

        return (
          <button
            key={item.label}
            type="button"
            className={itemClassName}
            onClick={() => handleItemClick(index, item)}
            aria-current={isActive ? "page" : undefined}
          >
            {itemContent}
          </button>
        );
      })}
    </nav>
  );
}

export { InteractiveMenu };
