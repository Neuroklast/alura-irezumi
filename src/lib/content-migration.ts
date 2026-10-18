import { demoContent } from "./demo";
import type { Content } from "./schema";
const legacyImage = (image: string) =>
  /^\/art\/(moth|bloom|serpent)-(skin|mirror|paper)\.svg$/.test(image);
const oldBio =
  "Ich bin Laura. Unter ALURA IREZUMI verbinde ich Tätowierungen und gravierte Spiegel. Eine Zeichnung ist der Anfang. Was daraus wird, entscheidet die Oberfläche.";
/** Retire only known seed artwork. Authored uploads, text edits and empty galleries survive. */
export function upgradeSeededContent(content: Content): Content {
  const legacy = content.works.some((work) => legacyImage(work.image));
  return {
    ...content,
    bio: content.bio === oldBio ? demoContent.bio : content.bio,
    scene: {
      ...content.scene,
      customImage:
        content.scene.customImage && legacyImage(content.scene.customImage)
          ? undefined
          : content.scene.customImage,
    },
    works: legacy
      ? [
          ...demoContent.works,
          ...content.works.filter((work) => !legacyImage(work.image)),
        ]
      : content.works,
  };
}
