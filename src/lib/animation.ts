// Animation config shared by the builder UI, the server renderer, and the
// client GSAP runtime. Serialized to data-* attributes on rendered elements.

export const ANIMATION_TYPES = [
  "none",
  "fade",
  "slide-up",
  "slide-down",
  "slide-left",
  "slide-right",
  "zoom-in",
  "zoom-out",
  "flip",
  "rotate",
  "blur",
] as const;
export type AnimationType = (typeof ANIMATION_TYPES)[number];

export type AnimationTrigger = "onload" | "onscroll";

export type Animation = {
  type: AnimationType;
  trigger?: AnimationTrigger;
  duration?: number;
  delay?: number;
  ease?: string;
  stagger?: number;
  once?: boolean;
};

export type AnimationPreset = {
  id: string;
  label: string;
  anim: Animation;
};

// One-click presets surfaced in the editor.
export const ANIMATION_PRESETS: AnimationPreset[] = [
  { id: "none", label: "None", anim: { type: "none" } },
  {
    id: "fade-up",
    label: "Fade Up",
    anim: {
      type: "slide-up",
      trigger: "onscroll",
      duration: 0.6,
      ease: "power2.out",
    },
  },
  {
    id: "fade-in",
    label: "Fade In",
    anim: {
      type: "fade",
      trigger: "onscroll",
      duration: 0.6,
      ease: "power2.out",
    },
  },
  {
    id: "zoom-in",
    label: "Zoom In On Scroll",
    anim: {
      type: "zoom-in",
      trigger: "onscroll",
      duration: 0.6,
      ease: "power2.out",
    },
  },
  {
    id: "slide-left",
    label: "Slide In Left",
    anim: {
      type: "slide-left",
      trigger: "onscroll",
      duration: 0.6,
      ease: "power2.out",
    },
  },
  {
    id: "flip",
    label: "Flip In",
    anim: {
      type: "flip",
      trigger: "onscroll",
      duration: 0.7,
      ease: "power2.out",
    },
  },
];

export const EASES = [
  "power1.out",
  "power2.out",
  "power3.out",
  "back.out(1.7)",
  "elastic.out(1,0.4)",
  "none",
] as const;

/** Escape a value for safe inclusion in an HTML attribute. */
function attr(value: string | number): string {
  return String(value).replace(/"/g, "&quot;");
}

/**
 * Serialize an animation to data-* attributes (string). Returns "" when there
 * is no animation, so non-animated elements stay clean.
 */
export function animAttrString(anim: Animation | undefined | null): string {
  if (!anim || !anim.type || anim.type === "none") return "";
  const parts = [`data-anim="${attr(anim.type)}"`];
  parts.push(`data-anim-trigger="${attr(anim.trigger ?? "onscroll")}"`);
  if (anim.duration != null)
    parts.push(`data-anim-duration="${attr(anim.duration)}"`);
  if (anim.delay != null) parts.push(`data-anim-delay="${attr(anim.delay)}"`);
  if (anim.ease) parts.push(`data-anim-ease="${attr(anim.ease)}"`);
  if (anim.stagger != null)
    parts.push(`data-anim-stagger="${attr(anim.stagger)}"`);
  if (anim.once != null)
    parts.push(`data-anim-once="${anim.once ? "1" : "0"}"`);
  return parts.join(" ");
}

export function hasAnimation(anim: Animation | undefined | null): boolean {
  return !!anim && anim.type !== "none";
}
