/**
 * Section → tutorial video registry.
 *
 * Add a section key + entry here, then drop
 * `<SectionTutorialDialog section={TutorialSection.X} />` into that
 * section's page header actions to surface a "Watch tutorial" trigger.
 */

export const TutorialSection = {
  STOCK_INTAKE: "stock_intake",
  ROLES_AND_STAFF: "roles_and_staff",
  STOCK_ITEM: "stock_item",
  STOCK_ITEM_CSV_IMPORT: "stock_item_csv_import",
  POS_ACCESS: "pos_access",
} as const;

export type TutorialSectionKey =
  (typeof TutorialSection)[keyof typeof TutorialSection];

export interface TutorialMeta {
  title: string;
  youtubeUrl: string;
  description?: string;
}

export const TUTORIALS: Partial<Record<TutorialSectionKey, TutorialMeta>> = {
  [TutorialSection.STOCK_INTAKE]: {
    title: "How to record a stock intake",
    youtubeUrl: "https://www.youtube.com/watch?v=P0272MuW5KM",
    description:
      "Walkthrough of receiving goods and confirming an intake into inventory.",
  },
  [TutorialSection.ROLES_AND_STAFF]: {
    title: "How to set up roles and staff",
    youtubeUrl: "https://www.youtube.com/watch?v=x9f6a-pDq4M",
    description:
      "Walkthrough of defining roles and permissions, then adding staff members.",
  },
  [TutorialSection.STOCK_ITEM]: {
    title: "How to add a stock item",
    youtubeUrl: "https://www.youtube.com/watch?v=rObDt07mfQA",
    description: "Walkthrough of adding a new stock item to track inventory.",
  },
  [TutorialSection.STOCK_ITEM_CSV_IMPORT]: {
    title: "How to add stock items via CSV",
    youtubeUrl: "https://www.youtube.com/watch?v=E_qwNyjt5bA",
    description: "Walkthrough of bulk-creating stock items and variants from a CSV file.",
  },
  [TutorialSection.POS_ACCESS]: {
    title: "How to pair devices and generate a location code",
    youtubeUrl: "https://www.youtube.com/watch?v=JX8JaEvofCs",
    description: "Walkthrough of pairing a device and generating a location code to access the POS.",
  },
};

/** Look up tutorial video metadata for a section. null = no video yet. */
export function getTutorial(section: TutorialSectionKey): TutorialMeta | null {
  return TUTORIALS[section] ?? null;
}
