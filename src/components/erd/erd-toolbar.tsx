import {
  IconDeviceFloppy,
  IconFileExport,
  IconFocusCentered,
  IconMinus,
  IconPlus,
  IconTablePlus,
} from "@tabler/icons-react";

import Button from "@/components/ui/button";
import MenuSelector, { type MenuSelectorOption } from "@/components/ui/menu-selector";
import {
  ERD_SAVE_STATE_DOT,
  ERD_SAVE_STATE_LABELS,
  ERD_TOOLBAR_ICON_BUTTON_CLASSES,
} from "@/constants/erd";
import type { ErdSaveState } from "@/types/erd";

interface Props {
  projectOptions: MenuSelectorOption[];
  projectId: string;
  scale: number;
  saveState: ErdSaveState;
  isDisabled: boolean;
  onProjectChange(projectId: string): void;
  onAddTable(): void;
  onZoom(direction: 1 | -1): void;
  onResetView(): void;
  onExport(): void;
  onSave(): void;
}

export default function ErdToolbar(props: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-background-focus px-4 py-2">
      <MenuSelector
        ariaLabel="Project"
        className="w-52"
        options={props.projectOptions}
        value={props.projectId}
        placeholder="Select a project"
        onChange={props.onProjectChange} />

      <Button
        onClick={props.onAddTable}
        disabled={props.isDisabled}>
        <IconTablePlus size={14} strokeWidth={1.8} className="mr-1" />
        Add table
      </Button>

      <div className="flex items-center gap-0.5 rounded-md border border-background-focus bg-background-card p-0.5">
        <button
          type="button"
          aria-label="Zoom out"
          className={ERD_TOOLBAR_ICON_BUTTON_CLASSES}
          onClick={() => props.onZoom(-1)}>
          <IconMinus size={14} strokeWidth={1.8} />
        </button>
        <span className="w-11 text-center text-xs tabular-nums text-foreground-off">
          {Math.round(props.scale * 100)}%
        </span>
        <button
          type="button"
          aria-label="Zoom in"
          className={ERD_TOOLBAR_ICON_BUTTON_CLASSES}
          onClick={() => props.onZoom(1)}>
          <IconPlus size={14} strokeWidth={1.8} />
        </button>
        <button
          type="button"
          aria-label="Reset view"
          title="Reset view"
          className={ERD_TOOLBAR_ICON_BUTTON_CLASSES}
          onClick={props.onResetView}>
          <IconFocusCentered size={14} strokeWidth={1.8} />
        </button>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <p
          role="status"
          className="flex items-center gap-1.5 text-xs text-foreground-off">
          <span
            aria-hidden="true"
            className={`h-1.5 w-1.5 rounded-full ${ERD_SAVE_STATE_DOT[props.saveState]}`} />
          {ERD_SAVE_STATE_LABELS[props.saveState]}
        </p>

        <Button
          variant="secondary"
          onClick={props.onExport}
          disabled={props.isDisabled}>
          <IconFileExport size={14} strokeWidth={1.8} className="mr-1" />
          Export
        </Button>

        <Button
          variant="secondary"
          onClick={props.onSave}
          disabled={props.isDisabled || props.saveState === "saving" || props.saveState === "saved"}>
          <IconDeviceFloppy size={14} strokeWidth={1.8} className="mr-1" />
          Save
        </Button>
      </div>
    </div>
  );
}
