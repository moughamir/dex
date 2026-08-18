/**
 * The only source of keyframes in the system. Consumers pick a preset by name;
 * they never write inline keyframes (consumer contract, see Animation.md).
 *
 * Keyframes use `transform` and `opacity` only — the compositor-friendly
 * property set mandated by ADR-0003. No layout properties are ever animated.
 */
export const presets: {
  fade: { enter: Keyframe[]; exit: Keyframe[] };
  pop: { enter: Keyframe[]; exit: Keyframe[] };
} = {
  fade: {
    enter: [{ opacity: 0 }, { opacity: 1 }],
    exit: [{ opacity: 1 }, { opacity: 0 }],
  },
  pop: {
    enter: [
      { opacity: 0, transform: "scale(0.96)" },
      { opacity: 1, transform: "scale(1)" },
    ],
    exit: [
      { opacity: 1, transform: "scale(1)" },
      { opacity: 0, transform: "scale(0.97)" },
    ],
  },
};
