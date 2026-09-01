import { getTutorial, TutorialSectionKey } from "@/lib/tutorials";
import { TutorialVideoDialog } from "@/components/widgets/help/tutorial-video-dialog";

/**
 * Looks up `section` in the tutorials registry (`lib/tutorials.ts`) and
 * renders the "Watch tutorial" trigger for it. Renders nothing if the
 * section has no video registered yet, so it's safe to add to a page
 * ahead of having a video ready.
 */
export function SectionTutorialDialog({
  section,
}: {
  section: TutorialSectionKey;
}) {
  const tutorial = getTutorial(section);
  if (!tutorial) return null;

  return (
    <TutorialVideoDialog
      title={tutorial.title}
      youtubeUrl={tutorial.youtubeUrl}
      description={tutorial.description}
    />
  );
}
