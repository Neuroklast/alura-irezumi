export const motifs = {
  mew: { name: "Mew", image: "/art/mew.svg" },
  espeon: { name: "Psiana", image: "/art/espeon.svg" },
  marowak: { name: "Knogga", image: "/art/marowak.svg" },
  vaporeon: { name: "Aquana", image: "/art/vaporeon.svg" },
} as const;
export type MotifKey = keyof typeof motifs;
