"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ui } from "@/components/dashboard/ui";
import {
  isValidEmail,
  isValidPhone,
  normalizeLinkValue,
  safeJson,
} from "@/lib/dashboard-helpers";
import type { LinkItem } from "@/hooks/useDashboardData";

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type LinkGroupItem = {
  _id: string;
  name: string;
  order: number;
  isActive: boolean;
};

const OTHER_GROUP_ID = "__other__";

function toStr(v: any) {
  return v == null ? "" : String(v);
}

function normalizeForType(type: string, value: string) {
  const t = String(type || "");
  const v = String(value || "");

  if (t === "url" || t === "phone" || t === "email") {
    return normalizeLinkValue(t as any, v);
  }
  return v.trim();
}

function getGroupKeyForLink(l: any) {
  const gidRaw = l?.groupId;
  return gidRaw ? String(gidRaw) : OTHER_GROUP_ID;
}

function DragHandle() {
  return (
    <span
      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-400 hover:text-gray-600"
      title="Drag to reorder"
    >
      ⋮⋮
    </span>
  );
}

function SortableRow({
  id,
  children,
}: {
  id: string;
  children: (args: { dragHandleProps: any; isDragging: boolean }) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children({ dragHandleProps: { ...attributes, ...listeners }, isDragging })}
    </div>
  );
}

export default function LinksTab({
  links,
  busy,
  setBusy,
  setNotice,
  refreshLinks,
  setLinks,
}: {
  links: LinkItem[];
  busy: any;
  setBusy: any;
  setNotice: any;
  refreshLinks: () => Promise<void>;
  setLinks: React.Dispatch<React.SetStateAction<LinkItem[]>>;
}) {
  const [groups, setGroups] = useState<LinkGroupItem[]>([]);
  const [newGroupName, setNewGroupName] = useState("");

  const [localLinks, setLocalLinks] = useState<LinkItem[]>(links || []);
  useEffect(() => setLocalLinks(links || []), [links]);

  const setLinksBoth = (updater: React.SetStateAction<LinkItem[]>) => {
    setLocalLinks(updater as any);
    setLinks(updater as any);
  };

  const [linkForm, setLinkForm] = useState<{
    type: any;
    label: string;
    value: string;
    groupId: string;
    platform: string;
    isActive: boolean;
  }>({
    type: "",
    label: "",
    value: "",
    groupId: OTHER_GROUP_ID,
    platform: "",
    isActive: true,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchGroups = async () => {
    const res = await fetch("/api/link-groups", { credentials: "same-origin" });
    const data = await safeJson<LinkGroupItem[]>(res);
    if (res.ok) setGroups(data || []);
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const groupsSorted = useMemo(() => {
    return [...groups].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [groups]);

  const groupsWithOther = useMemo(() => {
    return [
      ...groupsSorted,
      { _id: OTHER_GROUP_ID, name: "Other", order: 999999, isActive: true },
    ];
  }, [groupsSorted]);

  const groupedLinks = useMemo(() => {
    const map = new Map<string, LinkItem[]>();
    for (const l of localLinks) {
      const key = getGroupKeyForLink(l as any);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(l);
    }

    for (const [k, arr] of map.entries()) {
      arr.sort((a: any, b: any) => {
        const ao = typeof a?.order === "number" ? a.order : 0;
        const bo = typeof b?.order === "number" ? b.order : 0;
        if (ao !== bo) return ao - bo;
        return String(a?._id).localeCompare(String(b?._id));
      });
      map.set(k, arr);
    }

    return map;
  }, [localLinks]);

  const submitGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);

    const name = newGroupName.trim();
    if (!name) {
      setNotice({ type: "err", text: "Group name is required." });
      return;
    }

    setBusy((b: any) => ({ ...b, group: true }));
    try {
      const res = await fetch("/api/link-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ name }),
      });

      const data = await safeJson<any>(res);
      if (!res.ok) {
        setNotice({ type: "err", text: data?.message || "Failed to add group" });
        return;
      }

      setNotice({ type: "ok", text: "Group added ✅" });
      setNewGroupName("");
      await fetchGroups();
    } finally {
      setBusy((b: any) => ({ ...b, group: false }));
    }
  };

  const toggleGroup = async (id: string, isActive: boolean) => {
    if (id === OTHER_GROUP_ID) return;
    await fetch(`/api/link-groups/${id}/toggle`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ isActive }),
    });
    await fetchGroups();
  };

  const submitLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);

    if (!linkForm.type || !linkForm.label.trim() || !linkForm.value.trim()) {
      setNotice({ type: "err", text: "All link fields are required." });
      return;
    }

    const t = String(linkForm.type);
    const normalized = normalizeForType(t, linkForm.value);

    if (t === "email" && !isValidEmail(normalized)) {
      setNotice({ type: "err", text: "Please enter a valid email." });
      return;
    }
    if (t === "phone" && !isValidPhone(normalized)) {
      setNotice({ type: "err", text: "Please enter a valid phone number." });
      return;
    }

    setBusy((b: any) => ({ ...b, link: true }));
    try {
      const groupIdPayload =
        !linkForm.groupId || linkForm.groupId === OTHER_GROUP_ID
          ? null
          : linkForm.groupId;

      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          type: t,
          label: linkForm.label.trim(),
          value: normalized,
          groupId: groupIdPayload,
          platform: toStr(linkForm.platform).trim().toLowerCase(),
          isActive: !!linkForm.isActive,
        }),
      });

      const data = await safeJson<any>(res);
      if (!res.ok) {
        setNotice({ type: "err", text: data?.message || "Failed to add link" });
        return;
      }

      setNotice({ type: "ok", text: "Link added ✅" });
      setLinkForm({
        type: "",
        label: "",
        value: "",
        groupId: OTHER_GROUP_ID,
        platform: "",
        isActive: true,
      });

      await refreshLinks();
    } finally {
      setBusy((b: any) => ({ ...b, link: false }));
    }
  };

  const toggleLink = async (id: string, isActive: boolean) => {
    await fetch(`/api/links/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ isActive }),
    });
    await refreshLinks();
  };

  const delLink = async (id: string) => {
    await fetch(`/api/links/${id}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    await refreshLinks();
  };

  const onDragEndGroups = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const ids = groupsSorted.map((g) => g._id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    const next = arrayMove(groupsSorted, oldIndex, newIndex);
    setGroups(next.map((g, idx) => ({ ...g, order: idx })) as any);

    try {
      await fetch("/api/link-groups/reorder-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ orderedIds: next.map((g) => g._id) }),
      });
    } finally {
      await fetchGroups();
    }
  };

  const onDragEndLinks = async (groupKey: string, event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const list = groupedLinks.get(groupKey) || [];
    const ids = list.map((l: any) => String(l._id));

    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    const nextList = arrayMove(list, oldIndex, newIndex);

    setLinksBoth((prev) => {
      const prevArr = Array.isArray(prev) ? prev : [];
      const nextIds = new Set(nextList.map((x: any) => String(x._id)));

      const others = prevArr.filter((x: any) => !nextIds.has(String(x._id)));
      const reordered = nextList.map((x: any, idx: number) => ({
        ...x,
        order: idx,
      }));

      return [...others, ...reordered] as any;
    });

    const groupIdPayload = groupKey === OTHER_GROUP_ID ? null : groupKey;

    try {
      await fetch("/api/links/reorder-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          groupId: groupIdPayload,
          orderedIds: nextList.map((l: any) => String(l._id)),
        }),
      });
    } finally {
      await refreshLinks();
    }
  };

  return (
    <section className="space-y-4">
      <section className={ui.card}>
        <div className={ui.cardPad}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className={ui.sectionTitle}>Link Groups</h2>
              <p className={ui.sectionDesc}>
                Drag groups to reorder. Hide a group to remove it from public page.
              </p>
            </div>
            <button type="button" className={ui.miniBtn} onClick={fetchGroups}>
              Refresh
            </button>
          </div>

          <form onSubmit={submitGroup} className="mt-5 flex gap-2">
            <input
              value={newGroupName}
              placeholder="e.g. Social"
              className={ui.input}
              onChange={(e) => setNewGroupName(e.target.value)}
            />
            <button className={ui.primaryBtn} disabled={!!busy.group}>
              {busy.group ? "Adding..." : "Add group"}
            </button>
          </form>

          <div className="mt-4">
            {groupsSorted.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center">
                <p className="text-sm font-semibold text-gray-900">No groups yet</p>
                <p className="mt-1 text-xs text-gray-500">
                  Create a group to organize links.
                </p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={onDragEndGroups}
              >
                <SortableContext
                  items={groupsSorted.map((g) => g._id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {groupsSorted.map((g) => (
                      <SortableRow key={g._id} id={g._id}>
                        {({ dragHandleProps }) => (
                          <div className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <span
                                {...dragHandleProps}
                                className="cursor-grab active:cursor-grabbing"
                              >
                                <DragHandle />
                              </span>

                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold text-gray-900">
                                  {g.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Status: {g.isActive ? "Active" : "Hidden"}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                className={ui.miniBtn}
                                onClick={() => toggleGroup(g._id, !g.isActive)}
                              >
                                {g.isActive ? "Hide" : "Show"}
                              </button>
                            </div>
                          </div>
                        )}
                      </SortableRow>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      </section>

      <section className={ui.card}>
        <div className={ui.cardPad}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className={ui.sectionTitle}>Links</h2>
              <p className={ui.sectionDesc}>
                Drag links to reorder inside each group. Toggle to hide on public page.
              </p>
            </div>

            <button type="button" className={ui.miniBtn} onClick={refreshLinks}>
              Refresh
            </button>
          </div>

          <form onSubmit={submitLink} className="mt-5 space-y-3">
            <div className="space-y-1">
              <div className={ui.label}>Group</div>
              <select
                value={linkForm.groupId}
                className={ui.select}
                onChange={(e) =>
                  setLinkForm((f) => ({ ...f, groupId: e.target.value }))
                }
              >
                <option value={OTHER_GROUP_ID}>Other (no group)</option>
                {groupsSorted.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <div className={ui.label}>Type</div>
              <select
                value={linkForm.type}
                className={ui.select}
                onChange={(e) =>
                  setLinkForm((f) => ({ ...f, type: e.target.value }))
                }
              >
                <option value="">Select type</option>
                <option value="url">URL</option>
                <option value="phone">Phone</option>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="social">Social</option>
                <option value="messaging">Messaging</option>
              </select>
            </div>

            <div className="space-y-1">
              <div className={ui.label}>Platform (optional)</div>
              <input
                value={linkForm.platform}
                placeholder="whatsapp, telegram, facebook, linkedin, x, instagram..."
                className={ui.input}
                onChange={(e) =>
                  setLinkForm((f) => ({ ...f, platform: e.target.value }))
                }
              />
              <p className="mt-1 text-[11px] text-gray-500">
                Tip: For Social/Messaging, you can enter username (zahid) or full URL.
              </p>
            </div>

            <div className="space-y-1">
              <div className={ui.label}>Label</div>
              <input
                value={linkForm.label}
                placeholder="Website, WhatsApp, Email…"
                className={ui.input}
                onChange={(e) =>
                  setLinkForm((f) => ({ ...f, label: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1">
              <div className={ui.label}>Value</div>
              <input
                value={linkForm.value}
                placeholder={
                  linkForm.type === "email"
                    ? "email@domain.com"
                    : linkForm.type === "phone"
                      ? "+880..."
                      : "https://... or username"
                }
                className={ui.input}
                onChange={(e) =>
                  setLinkForm((f) => ({ ...f, value: e.target.value }))
                }
              />
            </div>

            <button className={ui.primaryBtn} disabled={!!busy.link}>
              {busy.link ? "Adding..." : "Add link"}
            </button>
          </form>

          <div className="mt-6 space-y-4">
            {groupsWithOther.map((g) => {
              const title = g._id === OTHER_GROUP_ID ? "Other" : g.name;
              const list = groupedLinks.get(g._id) || [];
              const linkIds = list.map((l: any) => String(l._id));

              return (
                <div key={g._id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-900">
                      {title}{" "}
                      {g._id !== OTHER_GROUP_ID && !g.isActive && (
                        <span className="text-xs font-medium text-gray-500">
                          (Hidden)
                        </span>
                      )}
                    </div>
                  </div>

                  {list.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-4 text-center text-xs text-gray-500">
                      No links in this section yet.
                    </div>
                  ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(e) => onDragEndLinks(g._id, e)}
                    >
                      <SortableContext
                        items={linkIds}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2">
                          {list.map((link: any) => (
                            <SortableRow key={String(link._id)} id={String(link._id)}>
                              {({ dragHandleProps }) => (
                                <div className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 transition hover:bg-gray-50">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <span
                                      {...dragHandleProps}
                                      className="cursor-grab active:cursor-grabbing"
                                    >
                                      <DragHandle />
                                    </span>

                                    <div className="min-w-0">
                                      <div className="truncate text-sm font-semibold text-gray-900">
                                        {link.label}{" "}
                                        {!link.isActive && (
                                          <span className="text-xs font-medium text-gray-500">
                                            (Hidden)
                                          </span>
                                        )}
                                      </div>
                                      <div className="truncate text-xs text-gray-500">
                                        {link.value}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      className={ui.miniBtn}
                                      onClick={() =>
                                        toggleLink(String(link._id), !link.isActive)
                                      }
                                    >
                                      {link.isActive ? "Hide" : "Show"}
                                    </button>
                                    <button
                                      type="button"
                                      className={ui.dangerMiniBtn}
                                      onClick={() => delLink(String(link._id))}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </div>
                              )}
                            </SortableRow>
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </section>
  );
}
