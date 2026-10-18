export const motifs = {
  mew: {
    name: "Mew",
    image: "/art/mew.svg",
    engravingImage: "/art/mew-engraving.svg",
  },
  espeon: {
    name: "Psiana",
    image: "/art/espeon.svg",
    engravingImage: "/art/espeon-engraving.svg",
  },
  marowak: {
    name: "Alola-Knogga",
    image: "/art/marowak.svg",
    engravingImage: "/art/marowak-engraving.svg",
  },
  vaporeon: {
    name: "Aquana",
    image: "/art/vaporeon.svg",
    engravingImage: "/art/vaporeon-engraving.svg",
  },
} as const;
export type MotifKey = keyof typeof motifs;
