"use client";

import {
  useEffect,
  useMemo,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from "react";

import ErdRelationLayer from "@/components/erd/erd-relation-layer";
import ErdTableNode from "@/components/erd/erd-table-node";
import {
  ERD_GRID_SIZE,
  ERD_WHEEL_ZOOM_SENSITIVITY,
} from "@/constants/erd";
import type { ErdDocument, ErdTable, ErdViewport } from "@/types/erd";
import { clampErdScale, snapErdCoordinate } from "@/utils/erd";

interface Props {
  canvasRef: RefObject<HTMLDivElement | null>;
  document: ErdDocument;
  viewport: ErdViewport;
  selectedTableId: string | null;
  onViewportChange(viewport: ErdViewport): void;
  onSelectTable(tableId: string | null): void;
  onMoveTable(tableId: string, position: { x: number; y: number }): void;
  children?: ReactNode;
}

type CanvasInteraction =
  | {
    kind: "pan";
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  }
  | {
    kind: "drag";
    pointerId: number;
    tableId: string;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  };

export default function ErdCanvas(props: Props) {
  const { canvasRef, viewport, onViewportChange } = props;
  const interactionRef = useRef<CanvasInteraction | null>(null);
  const viewportRef = useRef(viewport);

  useEffect(() => {
    viewportRef.current = viewport;
  }, [viewport]);

  const foreignKeyColumnIds = useMemo(() => (
    new Set(props.document.relations.map(relation => relation.fromColumnId))
  ), [props.document.relations]);

  // Wheel pans the canvas; ctrl/cmd + wheel (and trackpad pinch) zooms around the pointer.
  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const current = viewportRef.current;

      if (!event.ctrlKey && !event.metaKey) {
        onViewportChange({
          ...current,
          x: current.x - event.deltaX,
          y: current.y - event.deltaY,
        });
        return;
      }

      const bounds = canvas.getBoundingClientRect();
      const pointerX = event.clientX - bounds.left;
      const pointerY = event.clientY - bounds.top;
      const nextScale = clampErdScale(current.scale * (1 - event.deltaY * ERD_WHEEL_ZOOM_SENSITIVITY));
      const worldX = (pointerX - current.x) / current.scale;
      const worldY = (pointerY - current.y) / current.scale;

      onViewportChange({
        x: pointerX - worldX * nextScale,
        y: pointerY - worldY * nextScale,
        scale: nextScale,
      });
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });

    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [canvasRef, onViewportChange]);

  const startPan = (event: ReactPointerEvent<HTMLDivElement>) => {
    const startedOnOverlay = (event.target as HTMLElement).closest("[data-erd-overlay]");

    if (event.button !== 0 || startedOnOverlay) {
      return;
    }

    props.onSelectTable(null);
    event.currentTarget.setPointerCapture(event.pointerId);
    interactionRef.current = {
      kind: "pan",
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: viewport.x,
      originY: viewport.y,
    };
  };

  const startDrag = (event: ReactPointerEvent<HTMLElement>, table: ErdTable) => {
    if (event.button !== 0) {
      return;
    }

    canvasRef.current?.setPointerCapture(event.pointerId);
    interactionRef.current = {
      kind: "drag",
      pointerId: event.pointerId,
      tableId: table.id,
      startX: event.clientX,
      startY: event.clientY,
      originX: table.x,
      originY: table.y,
    };
  };

  const moveInteraction = (event: ReactPointerEvent<HTMLDivElement>) => {
    const interaction = interactionRef.current;

    if (!interaction || interaction.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - interaction.startX;
    const deltaY = event.clientY - interaction.startY;

    if (interaction.kind === "pan") {
      onViewportChange({
        ...viewport,
        x: interaction.originX + deltaX,
        y: interaction.originY + deltaY,
      });
      return;
    }

    const nextX = snapErdCoordinate(interaction.originX + deltaX / viewport.scale);
    const nextY = snapErdCoordinate(interaction.originY + deltaY / viewport.scale);
    const table = props.document.tables.find(item => item.id === interaction.tableId);

    if (table && (table.x !== nextX || table.y !== nextY)) {
      props.onMoveTable(interaction.tableId, { x: nextX, y: nextY });
    }
  };

  const endInteraction = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (interactionRef.current?.pointerId !== event.pointerId) {
      return;
    }

    interactionRef.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const gridSize = ERD_GRID_SIZE * viewport.scale;

  return (
    <div
      ref={canvasRef}
      data-lenis-prevent
      role="application"
      aria-label="Entity relationship diagram canvas"
      className="relative min-h-0 min-w-0 flex-1 cursor-default touch-none overflow-hidden bg-background select-none"
      style={{
        backgroundImage: "radial-gradient(circle, var(--color-background-focus) 1px, transparent 1px)",
        backgroundSize: `${gridSize}px ${gridSize}px`,
        backgroundPosition: `${viewport.x}px ${viewport.y}px`,
      }}
      onPointerDown={startPan}
      onPointerMove={moveInteraction}
      onPointerUp={endInteraction}
      onPointerCancel={endInteraction}>
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
        }}>
        <ErdRelationLayer
          document={props.document}
          selectedTableId={props.selectedTableId} />

        {props.document.tables.map(table => (
          <ErdTableNode
            key={table.id}
            table={table}
            isSelected={table.id === props.selectedTableId}
            foreignKeyColumnIds={foreignKeyColumnIds}
            onSelect={props.onSelectTable}
            onStartDrag={startDrag} />
        ))}
      </div>

      {props.children}
    </div>
  );
}
