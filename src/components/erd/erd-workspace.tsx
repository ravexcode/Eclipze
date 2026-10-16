"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IconFolderPlus, IconTablePlus } from "@tabler/icons-react";

import ErdAgentPanel from "@/components/erd/erd-agent-panel";
import ErdCanvas from "@/components/erd/erd-canvas";
import ErdDatabaseDialog from "@/components/erd/erd-database-dialog";
import ErdExportDialog from "@/components/erd/erd-export-dialog";
import ErdTablePanel from "@/components/erd/erd-table-panel";
import ErdToolbar from "@/components/erd/erd-toolbar";
import Button from "@/components/ui/button";
import {
  ERD_DEFAULT_VIEWPORT,
  ERD_NEW_TABLE_STAGGER,
  ERD_SCALE_STEP,
  ERD_TABLE_WIDTH,
} from "@/constants/erd";
import type { ErdColumn, ErdDocument, ErdRelation, ErdTable, ErdViewport } from "@/types/erd";
import type { WorkspaceProject } from "@/types/user";
import { apiFetch } from "@/utils/api-fetch";
import {
  clampErdScale,
  createErdColumn,
  createErdId,
  createErdTable,
  createUniqueColumnName,
  findErdTable,
  readErdProjectFromUrl,
  removeErdColumn,
  removeErdTable,
  updateErdTable,
  writeErdProjectToUrl,
} from "@/utils/erd";
import { errorMessage, readJson } from "@/utils/json-payload";
import { useDatabaseConnections } from "@/utils/use-database-connections";
import { useErdDiagram } from "@/utils/use-erd-diagram";

export default function ErdWorkspace() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [projects, setProjects] = useState<WorkspaceProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<ErdViewport>(ERD_DEFAULT_VIEWPORT);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [showAgent, setShowAgent] = useState(false);
  const [showDatabase, setShowDatabase] = useState(false);

  const diagram = useErdDiagram(projectId);
  const { document, updateDocument, save, saveState } = diagram;
  const selectedTable = selectedTableId ? findErdTable(document, selectedTableId) : undefined;
  const selectedProject = projects.find(project => project.id === projectId);
  const databaseConnections = useDatabaseConnections(Boolean(projectId));

  useEffect(() => {
    let cancelled = false;

    const loadProjects = async () => {
      try {
        const response = await apiFetch("/api/projects");
        const payload = await readJson(response) as { projects?: WorkspaceProject[] } | null;

        if (!response.ok) {
          throw new Error(errorMessage(payload, "Unable to load projects."));
        }

        if (cancelled) return;

        const loadedProjects = payload?.projects ?? [];
        const requestedProjectId = readErdProjectFromUrl();
        const initialProject = loadedProjects.find(project => project.id === requestedProjectId) ?? loadedProjects[0];

        setProjects(loadedProjects);
        setProjectId(initialProject?.id ?? null);
      } catch (error) {
        if (!cancelled) {
          setProjectsError(error instanceof Error ? error.message : "Unable to load projects.");
        }
      } finally {
        if (!cancelled) {
          setProjectsLoading(false);
        }
      }
    };

    void loadProjects();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleSaveShortcut = (event: KeyboardEvent) => {
      const isSaveShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s";

      if (!isSaveShortcut) return;

      event.preventDefault();
      void save();
    };

    window.addEventListener("keydown", handleSaveShortcut);

    return () => window.removeEventListener("keydown", handleSaveShortcut);
  }, [save]);

  const changeProject = async (nextProjectId: string) => {
    if (nextProjectId === projectId) {
      return;
    }

    if (saveState === "unsaved" || saveState === "error") {
      const saved = await save();

      if (!saved) return;
    }

    writeErdProjectToUrl(nextProjectId);
    setSelectedTableId(null);
    setViewport(ERD_DEFAULT_VIEWPORT);
    setProjectId(nextProjectId);
  };

  const zoom = (direction: 1 | -1) => {
    const canvas = canvasRef.current;
    const centerX = (canvas?.clientWidth ?? 0) / 2;
    const centerY = (canvas?.clientHeight ?? 0) / 2;

    setViewport(current => {
      const nextScale = clampErdScale(current.scale + direction * ERD_SCALE_STEP);
      const worldX = (centerX - current.x) / current.scale;
      const worldY = (centerY - current.y) / current.scale;

      return {
        x: centerX - worldX * nextScale,
        y: centerY - worldY * nextScale,
        scale: nextScale,
      };
    });
  };

  const addTable = () => {
    const canvas = canvasRef.current;
    const stagger = (document.tables.length % 6) * ERD_NEW_TABLE_STAGGER;
    const position = {
      x: ((canvas?.clientWidth ?? 0) / 2 - viewport.x) / viewport.scale - ERD_TABLE_WIDTH / 2 + stagger,
      y: ((canvas?.clientHeight ?? 0) / 3 - viewport.y) / viewport.scale + stagger,
    };
    const table = createErdTable(document.tables, position);

    updateDocument(current => ({
      ...current,
      tables: [...current.tables, table],
    }));
    setSelectedTableId(table.id);
  };

  const moveTable = useCallback((tableId: string, position: { x: number; y: number }) => {
    updateDocument(current => updateErdTable(current, tableId, position));
  }, [updateDocument]);

  const changeTable = (tableId: string, changes: Partial<ErdTable>) => {
    updateDocument(current => updateErdTable(current, tableId, changes));
  };

  const addColumn = (tableId: string) => {
    updateDocument(current => {
      const table = findErdTable(current, tableId);

      if (!table) return current;

      return updateErdTable(current, tableId, {
        columns: [
          ...table.columns,
          createErdColumn({ name: createUniqueColumnName(table) }),
        ],
      });
    });
  };

  const changeColumn = (tableId: string, columnId: string, changes: Partial<ErdColumn>) => {
    updateDocument(current => {
      const table = findErdTable(current, tableId);

      if (!table) return current;

      return updateErdTable(current, tableId, {
        columns: table.columns.map(column => (
          column.id === columnId
            ? { ...column, ...changes }
            : column
        )),
      });
    });
  };

  const addRelation = (relation: Omit<ErdRelation, "id">) => {
    updateDocument(current => ({
      ...current,
      relations: [...current.relations, { id: createErdId(), ...relation }],
    }));
  };

  const removeRelation = (relationId: string) => {
    updateDocument(current => ({
      ...current,
      relations: current.relations.filter(relation => relation.id !== relationId),
    }));
  };

  const selectTable = useCallback((tableId: string | null) => {
    setSelectedTableId(tableId);

    if (tableId) {
      setShowAgent(false);
    }
  }, []);

  const replaceDocument = useCallback((nextDocument: ErdDocument) => {
    updateDocument(() => nextDocument);
  }, [updateDocument]);

  const removeTable = (tableId: string) => {
    const table = findErdTable(document, tableId);
    const confirmed = window.confirm(`Delete the ${table?.name || "selected"} table and its relations?`);

    if (!confirmed) return;

    setSelectedTableId(null);
    updateDocument(current => removeErdTable(current, tableId));
  };

  const projectOptions = projects.map(project => ({
    value: project.id,
    label: project.name,
  }));
  const isEditorDisabled = !projectId || diagram.loading || Boolean(diagram.loadError);
  const errorText = projectsError ?? diagram.loadError ?? diagram.saveError;

  return (
    <main className="flex h-full min-w-0 flex-col">
      <header className="flex h-10 shrink-0 items-center px-4">
        <h1 className="text-xs text-foreground-off">
          ERD
        </h1>
      </header>

      {projectsLoading ? (
        <p
          role="status"
          className="px-5 pt-4 text-xs text-foreground-off sm:px-8">
          Loading projects…
        </p>
      ) : projects.length === 0 && !projectsError ? (
        <section className="flex flex-1 items-center justify-center px-5">
          <div className="animate-fade-in-up flex max-w-sm flex-col items-center gap-2 rounded-md border border-dashed border-background-focus px-6 py-10 text-center">
            <IconFolderPlus size={20} strokeWidth={1.6} className="text-foreground-off" />
            <p className="text-xs font-medium">
              Create a project first
            </p>
            <p className="text-xs text-foreground-off">
              Each diagram belongs to a project. Create one to start modeling its data.
            </p>
            <Button
              href="/projects?action=create"
              className="mt-2">
              New project
            </Button>
          </div>
        </section>
      ) : (
        <>
          <ErdToolbar
            projectOptions={projectOptions}
            projectId={projectId ?? ""}
            scale={viewport.scale}
            saveState={saveState}
            isDisabled={isEditorDisabled}
            onProjectChange={nextProjectId => void changeProject(nextProjectId)}
            onAddTable={addTable}
            onZoom={zoom}
            onResetView={() => setViewport(ERD_DEFAULT_VIEWPORT)}
            isAgentOpen={showAgent}
            connectedDatabaseCount={databaseConnections.connections.length}
            onToggleAgent={() => setShowAgent(current => !current)}
            onOpenDatabase={() => setShowDatabase(true)}
            onExport={() => setShowExport(true)}
            onSave={() => void save()} />

          {errorText ? (
            <p
              role="alert"
              className="border-b border-background-focus px-4 py-2 text-xs text-alert-red">
              {errorText}
            </p>
          ) : null}

          <div className="flex min-h-0 flex-1 flex-col md:flex-row">
            <ErdCanvas
              canvasRef={canvasRef}
              document={document}
              viewport={viewport}
              selectedTableId={selectedTable ? selectedTable.id : null}
              onViewportChange={setViewport}
              onSelectTable={selectTable}
              onMoveTable={moveTable}>
              {diagram.loading ? (
                <p
                  role="status"
                  className="absolute left-4 top-4 text-xs text-foreground-off">
                  Loading diagram…
                </p>
              ) : document.tables.length === 0 && !isEditorDisabled ? (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-5">
                  <div
                    data-erd-overlay
                    className="animate-fade-in-up pointer-events-auto flex max-w-sm flex-col items-center gap-2 rounded-md border border-dashed border-background-focus bg-background-card/80 px-6 py-10 text-center">
                    <IconTablePlus size={20} strokeWidth={1.6} className="text-foreground-off" />
                    <p className="text-xs font-medium">
                      No tables yet
                    </p>
                    <p className="text-xs text-foreground-off">
                      Add tables, define columns, and connect them with relations. Changes save automatically.
                    </p>
                    <Button
                      onClick={addTable}
                      className="mt-2">
                      Add table
                    </Button>
                  </div>
                </div>
              ) : null}
            </ErdCanvas>

            {showAgent ? (
              <ErdAgentPanel
                key={projectId}
                projectId={projectId}
                document={document}
                connections={databaseConnections.connections}
                onDocumentChange={replaceDocument}
                onOpenDatabase={() => setShowDatabase(true)}
                onClose={() => setShowAgent(false)} />
            ) : selectedTable ? (
              <ErdTablePanel
                key={selectedTable.id}
                document={document}
                table={selectedTable}
                onChangeTable={changes => changeTable(selectedTable.id, changes)}
                onAddColumn={() => addColumn(selectedTable.id)}
                onChangeColumn={(columnId, changes) => changeColumn(selectedTable.id, columnId, changes)}
                onRemoveColumn={columnId => updateDocument(current => removeErdColumn(current, selectedTable.id, columnId))}
                onAddRelation={addRelation}
                onRemoveRelation={removeRelation}
                onRemoveTable={() => removeTable(selectedTable.id)}
                onClose={() => setSelectedTableId(null)} />
            ) : null}
          </div>
        </>
      )}

      <ErdExportDialog
        isOpen={showExport}
        projectName={selectedProject?.name ?? "this project"}
        document={document}
        onClose={() => setShowExport(false)} />

      <ErdDatabaseDialog
        isOpen={showDatabase}
        connections={databaseConnections.connections}
        loading={databaseConnections.loading}
        loadError={databaseConnections.error}
        onConnect={databaseConnections.connect}
        onDisconnect={databaseConnections.disconnect}
        onClose={() => setShowDatabase(false)} />
    </main>
  );
}
