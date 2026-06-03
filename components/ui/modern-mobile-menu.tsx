"use client";

import React, { useEffect, useMemo, useState } from "react";

export type NavIconComponent = React.ComponentType<{
  className?: string;
  active?: boolean;
}>;

export interface InteractiveMenuItem {
  label: string;
  icon: NavIconComponent;
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

  const handleItemClick = (index: number) => {
    if (!finalItems) return;
    if (!isControlled) {
      setUncontrolledIndex(index);
    }
    onItemChange?.(index, finalItems[index]);
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

        return (
          <button
            key={item.label}
            type="button"
            className={`menu__item ${isActive ? "active" : ""}`}
            onClick={() => handleItemClick(index)}
            aria-current={isActive ? "page" : undefined}
          >
            <div className="menu__icon">
              <IconComponent className="icon" active={isActive} />
            </div>
            <strong className={`menu__text ${isActive ? "active" : ""}`}>
              {item.label}
            </strong>
          </button>
        );
      })}
    </nav>
  );
}

export { InteractiveMenu };
