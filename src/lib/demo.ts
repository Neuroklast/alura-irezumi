import type { Content } from "./schema";
export const demoContent: Content = {
  artist: "Laura",
  bio: "Ich bin Laura. Unter ALURA IREZUMI verbinde ich Tätowierungen und gravierte Spiegel. Eine Zeichnung ist der Anfang. Was daraus wird, entscheidet die Oberfläche.",
  instagram: "https://www.instagram.com/alura.irezumi/",
  scene: { motif: "moth", surface: 35, speed: 1, glow: 0.65 },
  works: [
    {
      id: "00000000-0000-4000-8000-000000000001",
      title: "Midnight wings",
      category: "tattoo",
      image: "/art/moth-skin.svg",
      description:
        "Illustratives Demomotiv. Linework und feine Schraffuren auf einer stilisierten Hautfläche.",
      available: false,
    },
    {
      id: "00000000-0000-4000-8000-000000000002",
      title: "Through the looking glass",
      category: "mirror",
      image: "/art/bloom-mirror.svg",
      description:
        "Illustrative Gravurstudie mit floralen Konturen und violetten Lichtreflexionen.",
      available: true,
    },
    {
      id: "00000000-0000-4000-8000-000000000003",
      title: "The serpent",
      category: "motif",
      image: "/art/serpent-paper.svg",
      description:
        "Freies Demodesign. Eine Studie zwischen Ornament und Bewegung.",
      available: true,
    },
    {
      id: "00000000-0000-4000-8000-000000000004",
      title: "Night garden",
      category: "tattoo",
      image: "/art/bloom-skin.svg",
      description: "Botanische Demostudie auf einer stilisierten Hautfläche.",
      available: false,
    },
    {
      id: "00000000-0000-4000-8000-000000000005",
      title: "Lunar reflection",
      category: "mirror",
      image: "/art/moth-mirror.svg",
      description:
        "Illustrativer Spiegelentwurf mit Nachtfalter und ornamentalem Rahmen.",
      available: true,
    },
    {
      id: "00000000-0000-4000-8000-000000000006",
      title: "Wild bloom",
      category: "motif",
      image: "/art/bloom-paper.svg",
      description: "Freies botanisches Demomotiv mit feinen Konturen.",
      available: true,
    },
  ],
};
