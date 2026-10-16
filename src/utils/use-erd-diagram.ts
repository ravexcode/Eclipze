"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ERD_AUTOSAVE_DELAY_MS, ERD_EMPTY_DOCUMENT } from "@/constants/erd";
import type { ErdDiagramResponse, ErdDocument, ErdSaveState } from "@/types/erd";
import { apiFetch } from "@/utils/api-fetch";
import { getErdDocumentError } from "@/utils/erd";
import { errorMessage, readJson } from "@/utils/json-payload";

export function useErdDiagram(projectId: string | null) {
  const [document, setDocument] = useState<ErdDocument>(ERD_EMPTY_DOCUMENT);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<ErdSaveState>("saved");
  const [saveError, setSaveError] = useState<string | null>(null);

  // Refs let a save in flight detect edits made while the request was running.
  const documentRef = useRef(document);
  const revisionRef = useRef(0);
  const isSavingRef = useRef(false);

  useEffect(() => {
    documentRef.current = document;
  }, [document]);

  useEffect(() => {
    if (!projectId) {
      return;
    }

    let cancelled = false;

    const loadDiagram = async () => {
      setLoading(true);
      setLoadError(null);
      setSaveError(null);
      setSaveState("saved");

      try {
        const response = await apiFetch(`/api/erd?projectId=${encodeURIComponent(projectId)}`);
        const payload = await readJson(response) as ErdDiagramResponse | null;

        if (!response.ok || !payload?.document) {
          throw new Error(errorMessage(payload, "Unable to load the diagram."));
        }

        if (cancelled) return;

        revisionRef.current = 0;
        setDocument(payload.document);
      } catch (error) {
        if (cancelled) return;

        setDocument(ERD_EMPTY_DOCUMENT);
        setLoadError(error instanceof Error ? error.message : "Unable to load the diagram.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadDiagram();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const updateDocument = useCallback((updater: (current: ErdDocument) => ErdDocument) => {
    revisionRef.current += 1;
    setDocument(updater);
    setSaveState("unsaved");
  }, []);

  const save = useCallback(async () => {
    if (!projectId || isSavingRef.current) {
      return false;
    }

    const documentError = getErdDocumentError(documentRef.current);

    if (documentError) {
      setSaveError(documentError);
      setSaveState("error");
      return false;
    }

    const savingRevision = revisionRef.current;
    isSavingRef.current = true;
    setSaveState("saving");
    setSaveError(null);

    try {
      const response = await apiFetch("/api/erd", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          projectId,
          document: documentRef.current,
        }),
      });
      const payload = await readJson(response);

      if (!response.ok) {
        setSaveError(errorMessage(payload, "Unable to save the diagram."));
        setSaveState("error");
        return false;
      }

      setSaveState(revisionRef.current === savingRevision ? "saved" : "unsaved");
      return true;
    } catch {
      setSaveError("Unable to save the diagram.");
      setSaveState("error");
      return false;
    } finally {
      isSavingRef.current = false;
    }
  }, [projectId]);

  useEffect(() => {
    if (saveState !== "unsaved") {
      return;
    }

    const autosaveTimer = window.setTimeout(() => {
      void save();
    }, ERD_AUTOSAVE_DELAY_MS);

    return () => window.clearTimeout(autosaveTimer);
  }, [document, saveState, save]);

  useEffect(() => {
    if (saveState === "saved") {
      return;
    }

    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    window.addEventListener("beforeunload", warnBeforeUnload);

    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [saveState]);

  return {
    document,
    loading,
    loadError,
    saveState,
    saveError,
    updateDocument,
    save,
  };
}
