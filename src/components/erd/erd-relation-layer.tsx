import {
  ERD_CARDINALITY_MARKER_OFFSET,
  ERD_CARDINALITY_MARKERS,
} from "@/constants/erd";
import type { ErdDocument } from "@/types/erd";
import { getErdRelationGeometry } from "@/utils/erd";

interface Props {
  document: ErdDocument;
  selectedTableId: string | null;
}

export default function ErdRelationLayer(props: Props) {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute left-0 top-0 overflow-visible"
      width={1}
      height={1}>
      {props.document.relations.map(relation => {
        const geometry = getErdRelationGeometry(props.document, relation);

        if (!geometry) {
          return null;
        }

        const isHighlighted = props.selectedTableId !== null && (
          relation.fromTableId === props.selectedTableId
          || relation.toTableId === props.selectedTableId
        );
        const strokeColor = isHighlighted
          ? "var(--color-accent)"
          : "var(--color-foreground-off)";
        const markers = ERD_CARDINALITY_MARKERS[relation.cardinality];

        return (
          <g key={relation.id}>
            <path
              d={geometry.path}
              fill="none"
              stroke={strokeColor}
              strokeWidth={isHighlighted ? 1.75 : 1.25}
              strokeOpacity={isHighlighted ? 1 : 0.7}
            />
            <circle
              cx={geometry.from.x}
              cy={geometry.from.y}
              r={3}
              fill={strokeColor} />
            <circle
              cx={geometry.to.x}
              cy={geometry.to.y}
              r={3}
              fill={strokeColor} />
            <text
              x={geometry.from.x + geometry.fromDirection * ERD_CARDINALITY_MARKER_OFFSET}
              y={geometry.from.y - 6}
              textAnchor="middle"
              fontSize={10}
              fill={strokeColor}>
              {markers.from}
            </text>
            <text
              x={geometry.to.x + geometry.toDirection * ERD_CARDINALITY_MARKER_OFFSET}
              y={geometry.to.y - 6}
              textAnchor="middle"
              fontSize={10}
              fill={strokeColor}>
              {markers.to}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
