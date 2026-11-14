import type { BodySystemId } from "../ui/viewTypes.ts";
import { Placeholder } from "./Placeholder";

type Props = { crewId: string; day: number; selected: BodySystemId | null; onSelect: (id: BodySystemId) => void };

// STUB: replaced by the full page design.
export function Health(_props: Props) {
  return <Placeholder title="Health" note="Being designed." />;
}
