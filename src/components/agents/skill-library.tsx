"use client";

import { useState } from "react";
import { IconCheck, IconPlus, IconSearch, IconTrash, IconX } from "@tabler/icons-react";

import Button from "@/components/ui/button";
import type { LibrarySkill, SkillSearchResult } from "@/types/agent-runner";
import { apiFetch } from "@/utils/api-fetch";
import { errorMessage, readJson } from "@/utils/json-payload";

type CatalogSkillPreview = {
  id: string;
  source: string;
  slug: string;
  version: string;
  content: string;
};

interface Props {
  skills: LibrarySkill[];
  selectedSkillIds: string[];
  onToggle(id: string): void;
  onSkillsChanged(newSkillId?: string): Promise<void>;
}

type LibraryMode = "installed" | "search" | "create";

export default function SkillLibrary(props: Props) {
  const [mode, setMode] = useState<LibraryMode>("installed");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SkillSearchResult[]>([]);
  const [preview, setPreview] = useState<CatalogSkillPreview | null>(null);
  const [previewResult, setPreviewResult] = useState<SkillSearchResult | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const searchSkills = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSearching(true);

    try {
      const response = await apiFetch(`/api/skills/search?q=${encodeURIComponent(query.trim())}`);
      const payload = await readJson(response) as { skills?: SkillSearchResult[]; message?: string };

      if (!response.ok) {
        setError(payload.message ?? "Unable to search skills.sh.");
        return;
      }

      setResults(payload.skills ?? []);
      setPreview(null);
      setPreviewResult(null);
    } catch {
      setError("Unable to search skills.sh.");
    } finally {
      setIsSearching(false);
    }
  };

  const loadPreview = async (skill: SkillSearchResult) => {
    setError(null);
    setMessage(null);

    try {
      const path = skill.id.split("/").map(encodeURIComponent).join("/");
      const response = await apiFetch(`/api/skills/catalog/${path}`);
      const payload = await readJson(response) as CatalogSkillPreview & { message?: string };

      if (!response.ok) {
        setError(payload.message ?? "Unable to load the skill preview.");
        return;
      }

      setPreview(payload);
      setPreviewResult(skill);
    } catch {
      setError("Unable to load the skill preview.");
    }
  };

  const importSkill = async () => {
    if (!preview || !previewResult) return;
    setError(null);
    setMessage(null);
    setIsSaving(true);

    try {
      const response = await apiFetch("/api/skills/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId: preview.id,
          name: previewResult.name,
          description: previewResult.description,
        }),
      });
      const payload = await readJson(response) as { skill?: LibrarySkill; message?: string };

      if (!response.ok || !payload.skill) {
        setError(payload.message ?? "Unable to import this skill.");
        return;
      }

      await props.onSkillsChanged(payload.skill.id);
      setMessage("Skill added to your library and selected for this task.");
      setPreview(null);
      setPreviewResult(null);
    } catch {
      setError("Unable to import this skill.");
    } finally {
      setIsSaving(false);
    }
  };

  const createSkill = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSaving(true);

    try {
      const response = await apiFetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, content }),
      });
      const payload = await readJson(response) as { skill?: LibrarySkill; message?: string };

      if (!response.ok || !payload.skill) {
        setError(payload.message ?? "Unable to save this skill.");
        return;
      }

      await props.onSkillsChanged(payload.skill.id);
      setName("");
      setDescription("");
      setContent("");
      setMode("installed");
      setMessage("Skill created and selected for this task.");
    } catch {
      setError("Unable to save this skill.");
    } finally {
      setIsSaving(false);
    }
  };

  const removeSkill = async (skill: LibrarySkill) => {
    setError(null);
    setMessage(null);

    try {
      const response = await apiFetch(`/api/skills/${skill.id}`, { method: "DELETE" });
      const payload = await readJson(response);

      if (!response.ok) {
        setError(errorMessage(payload, "Unable to remove this skill."));
        return;
      }

      await props.onSkillsChanged();
      setMessage("Skill removed from your library.");
    } catch {
      setError("Unable to remove this skill.");
    }
  };

  const isInstalled = (sourceId: string) =>
    props.skills.some(skill => skill.sourceId === sourceId);

  return (
    <section className="flex flex-col gap-4 rounded-sm border border-background-focus bg-background-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Skills</h2>
          <p className="mt-1 text-sm text-foreground-off">
            Add a reusable skill to this task or write one of your own.
          </p>
        </div>
        <div className="flex gap-1 rounded-sm bg-background-focus p-1" role="tablist" aria-label="Skill library">
          <ModeButton mode="installed" current={mode} onClick={setMode}>Library</ModeButton>
          <ModeButton mode="search" current={mode} onClick={setMode}>Search</ModeButton>
          <ModeButton mode="create" current={mode} onClick={setMode}>Create</ModeButton>
        </div>
      </div>

      {error ? <p role="alert" className="text-sm text-priority-high">{error}</p> : null}
      {message ? <p role="status" className="text-sm text-green-400">{message}</p> : null}

      {mode === "installed" ? (
        <div className="flex flex-col gap-2">
          {props.skills.length === 0 ? (
            <p className="rounded-sm bg-background-focus p-4 text-sm text-foreground-off">
              Your library is empty. Search skills.sh or create a skill to get started.
            </p>
          ) : props.skills.map(skill => {
            const selected = props.selectedSkillIds.includes(skill.id);

            return (
              <article key={skill.id} className="flex items-center justify-between gap-3 rounded-sm bg-background-focus p-3">
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => props.onToggle(skill.id)}
                  className="flex min-w-0 flex-1 items-start gap-3 text-left">
                  <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-xs border ${selected ? "border-accent bg-accent text-white" : "border-foreground-off/50 text-transparent"}`}>
                    <IconCheck size={13} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{skill.name}</span>
                    <span className="mt-0.5 block truncate text-xs text-foreground-off">
                      {skill.description || skill.source}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${skill.name}`}
                  onClick={() => void removeSkill(skill)}
                  className="shrink-0 rounded-xs p-2 text-foreground-off hover:bg-background-card hover:text-priority-high">
                  <IconTrash size={15} />
                </button>
              </article>
            );
          })}
        </div>
      ) : null}

      {mode === "search" ? (
        <div className="flex flex-col gap-3">
          <form onSubmit={searchSkills} className="flex gap-2">
            <label className="flex min-w-0 flex-1 items-center gap-2 rounded-sm bg-background-focus px-3">
              <IconSearch size={16} className="shrink-0 text-foreground-off" />
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Search skills.sh"
                minLength={2}
                className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-hidden" />
            </label>
            <Button type="submit" disabled={isSearching || query.trim().length < 2}>
              {isSearching ? "Searching…" : "Search"}
            </Button>
          </form>

          {results.length > 0 ? (
            <div className="grid gap-2 lg:grid-cols-2">
              {results.map(skill => (
                <article key={skill.id} className="flex flex-col justify-between gap-3 rounded-sm bg-background-focus p-3">
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="truncate text-sm font-medium">{skill.name}</h3>
                      <span className="shrink-0 text-xs text-foreground-off">{skill.installs.toLocaleString()} installs</span>
                    </div>
                    <p className="mt-1 truncate text-xs text-foreground-off">{skill.source}</p>
                    {skill.description ? <p className="mt-2 line-clamp-2 text-xs">{skill.description}</p> : null}
                    {skill.isDuplicate ? <p className="mt-1 text-xs text-warning">Detected duplicate</p> : null}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={() => void loadPreview(skill)}>
                      Preview
                    </Button>
                    {isInstalled(skill.id) ? (
                      <span className="flex items-center gap-1 px-3 text-xs text-green-400">
                        <IconCheck size={14} /> Added
                      </span>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : query.length >= 2 && !isSearching ? (
            <p className="text-sm text-foreground-off">No search results yet.</p>
          ) : null}

          {preview && previewResult ? (
            <div className="flex flex-col gap-3 rounded-sm border border-background-focus bg-background p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-medium">{previewResult.name}</h3>
                  <p className="mt-1 text-xs text-foreground-off">{preview.id}</p>
                </div>
                <button type="button" aria-label="Close preview" onClick={() => setPreview(null)} className="text-foreground-off hover:text-foreground">
                  <IconX size={17} />
                </button>
              </div>
              <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-xs bg-background-card p-3 text-xs text-foreground-off">{preview.content}</pre>
              <div className="flex justify-end">
                <Button type="button" onClick={() => void importSkill()} disabled={isSaving || isInstalled(preview.id)}>
                  <IconPlus size={15} className="mr-1.5" />
                  {isSaving ? "Adding…" : "Add to my library"}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {mode === "create" ? (
        <form onSubmit={createSkill} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-sm">
            Name
            <input required maxLength={100} value={name} onChange={event => setName(event.target.value)} className="rounded-sm bg-background-focus px-3 py-2" placeholder="Accessible UI review" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Description
            <input required maxLength={500} value={description} onChange={event => setDescription(event.target.value)} className="rounded-sm bg-background-focus px-3 py-2" placeholder="Checks a page for common accessibility issues." />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Instructions
            <textarea required maxLength={40_000} rows={7} value={content} onChange={event => setContent(event.target.value)} className="resize-y rounded-sm bg-background-focus px-3 py-2 text-sm outline-hidden" placeholder="Describe the steps and constraints the model should follow." />
          </label>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving…" : "Create skill"}
            </Button>
          </div>
        </form>
      ) : null}

      {mode !== "installed" && props.skills.length > 0 ? (
        <div className="border-t border-background-focus pt-3">
          <p className="mb-2 text-xs text-foreground-off">Already in your library</p>
          <div className="flex flex-wrap gap-2">
            {props.skills.map(skill => {
              const selected = props.selectedSkillIds.includes(skill.id);
              return (
                <button key={skill.id} type="button" onClick={() => props.onToggle(skill.id)} className={`rounded-xs px-2.5 py-1.5 text-xs ${selected ? "bg-accent text-white" : "bg-background-focus text-foreground-off hover:text-foreground"}`}>
                  {skill.name}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ModeButton(props: {
  mode: LibraryMode;
  current: LibraryMode;
  onClick(mode: LibraryMode): void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={props.current === props.mode}
      onClick={() => props.onClick(props.mode)}
      className={`rounded-xs px-2.5 py-1.5 text-xs transition-colors ${props.current === props.mode ? "bg-background-card text-foreground" : "text-foreground-off hover:text-foreground"}`}>
      {props.children}
    </button>
  );
}
