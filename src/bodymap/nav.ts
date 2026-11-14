// Sidebar entry for the Body Map page.
// The existing `Page` union in Sidebar.tsx is owned by a teammate and was left untouched, so this id
// is widened into it with a cast. Clean-up once agreed: add "bodymap" to the Page union and drop the cast.
import { Person, type Icon } from "@phosphor-icons/react";
import type { Page } from "../components/Sidebar";

export const BODY_MAP_PAGE = "bodymap" as string as Page;

export const BODY_MAP_NAV: { id: Page; label: string; icon: Icon } = { id: BODY_MAP_PAGE, label: "Body Map", icon: Person };
