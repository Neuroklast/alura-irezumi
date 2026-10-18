import type { Content } from "./schema";
export const demoContent: Content = {
  artist: "Laura",
  bio: "Hi, ich bin Laura. Ich tätowiere bei NEO TOKYO in Bochum und graviere Spiegel. Hier findest du meine Motive. Wenn dir eins gefällt oder du eine eigene Idee hast, schreib mir gern.",
  instagram: "https://www.instagram.com/alura.irezumi/",
  scene: { motif: "vaporeon", surface: 0, speed: 1, glow: 0.55 },
  works: [
    {
      id: "00000000-0000-4000-8000-000000000101",
      title: "Aquana",
      category: "motif",
      image: "/art/vaporeon.svg",
      description:
        "Wannado von Laura. Ob das Motiv noch frei ist, bitte direkt anfragen.",
      available: false,
    },
    {
      id: "00000000-0000-4000-8000-000000000102",
      title: "Mew",
      category: "motif",
      image: "/art/mew.svg",
      description:
        "Wannado von Laura. Ob das Motiv noch frei ist, bitte direkt anfragen.",
      available: false,
    },
    {
      id: "00000000-0000-4000-8000-000000000103",
      title: "Psiana",
      category: "motif",
      image: "/art/espeon.svg",
      description:
        "Wannado von Laura. Ob das Motiv noch frei ist, bitte direkt anfragen.",
      available: false,
    },
    {
      id: "00000000-0000-4000-8000-000000000104",
      title: "Knogga",
      category: "motif",
      image: "/art/marowak.svg",
      description:
        "Wannado von Laura. Ob das Motiv noch frei ist, bitte direkt anfragen.",
      available: false,
    },
  ],
};
