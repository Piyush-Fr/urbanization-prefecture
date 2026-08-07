import { useMemo } from "react";
import { useTheme } from "./ThemeProvider";

export type GlassSurfaceVariant =
  | "surface"
  | "surface-strong"
  | "surface-lg"
  | "surface-dark"
  | "fill"
  | "thumb"
  | "thumb-active"
  | "track"
  | "track-active"
  | "sheen"
  | "highlight"
  | "popover";

interface UseGlassSurfaceOptions {
  variant?: GlassSurfaceVariant;
  tint?: string;
  activeTint?: string;
  opacity?: number;
}

export interface UseGlassSurfaceResult {
  style: {
    background?: string;
    backgroundColor?: string;
    border?: string;
    boxShadow?: string;
  };
  className: string;
}

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function withAlpha(color: string, alphaBase: number, transparency: number, opacity = 1) {
  // Scale relative to the default 50% transparency so hardcoded base values
  // look correct at the default setting and respond smoothly as the slider moves.
  const alpha = Math.min(1, Math.max(0, alphaBase * (transparency / 50) * opacity));
  if (color.startsWith("#")) {
    const { r, g, b } = hexToRgb(color);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  return color;
}

export function useGlassSurface(options: UseGlassSurfaceOptions = {}): UseGlassSurfaceResult {
  const {
    variant = "surface",
    tint = "#3b82f6",
    activeTint = tint,
    opacity = 1,
  } = options;

  const { glass, mode, liquidGlass } = useTheme();
  // In liquid-glass mode the Transparency slider lives on liquidGlass, so
  // inline glass surfaces must use that value or they stop responding to the
  // main controls.
  const transparency =
    mode === "liquid-glass" ? liquidGlass.transparency : glass.transparency;

  return useMemo(() => {
    const w = (base: number) => withAlpha("#ffffff", base, transparency, opacity);

    switch (variant) {
      case "thumb":
        return {
          style: {
            background: `radial-gradient(circle at 30% 25%, ${w(0.95)} 0%, ${w(0.85)} 45%, ${w(0.70)} 100%)`,
            border: "1px solid rgba(255,255,255,0.4)",
            boxShadow:
              "inset 0 1px 2px rgba(255,255,255,0.8), 0 2px 6px rgba(0,0,0,0.15)",
          },
          className: "glass-blur-sm",
        };

      case "thumb-active":
        return {
          style: {
            background: `radial-gradient(circle at 30% 25%, ${w(0.20)} 0%, ${w(0.05)} 45%, transparent 100%)`,
            border: "1px solid rgba(255,255,255,0.4)",
            boxShadow:
              "inset 0 2px 4px rgba(255,255,255,0.6), inset 0 -1px 2px rgba(0,0,0,0.15), 0 8px 24px rgba(0,0,0,0.3)",
          },
          className: "glass-blur-xl",
        };

      case "track":
        return {
          style: {
            background: w(0.08),
            boxShadow: "inset 0 3px 8px rgba(0,0,0,0.28), inset 0 -1px 2px rgba(255,255,255,0.10)",
          },
          className: "glass-blur-xl border",
        };

      case "track-active":
        return {
          style: {
            background: `linear-gradient(135deg, ${withAlpha(tint, 0.30, transparency, opacity)} 0%, ${withAlpha(activeTint, 0.14, transparency, opacity)} 100%)`,
          },
          className: "",
        };

      case "sheen":
        return {
          style: {
            background: `linear-gradient(135deg, ${w(0.55)} 0%, ${w(0.08)} 45%, transparent 55%)`,
          },
          className: "pointer-events-none absolute inset-0",
        };

      case "highlight":
        return {
          style: {
            background: `linear-gradient(to right, transparent, ${w(0.20)}, transparent)`,
          },
          className: "pointer-events-none absolute inset-x-0 top-0 h-px rounded-full",
        };

      case "fill":
        return {
          style: {
            background: w(opacity),
          },
          className: "",
        };

      case "popover": {
        // Use the same proven glass-surface-strong + blur utilities as
        // Modal, CommandPalette, and Select so the panel visibly reacts to
        // all glass sliders exactly like the rest of the library.
        return {
          style: {},
          className: "glass-blur-xl glass-surface-strong glass-border glass-highlight",
        };
      }

      case "surface-strong":
        return {
          style: {},
          className: "glass-blur glass-surface-strong glass-border glass-highlight",
        };

      case "surface-lg":
        return {
          style: {},
          className: "glass-blur-lg glass-surface-strong glass-border glass-highlight",
        };

      case "surface-dark":
        return {
          style: {},
          className: "glass-blur-sm glass-surface-dark glass-border",
        };

      case "surface":
      default:
        return {
          style: {},
          className: "glass-blur glass-surface glass-border glass-highlight",
        };
    }
  }, [variant, tint, activeTint, opacity, transparency]);
}
