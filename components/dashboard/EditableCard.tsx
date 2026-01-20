"use client";

import { ReactNode } from "react";

export default function EditableCard({
  title,
  rightAction,
  children,
}: {
  title: string;
  rightAction?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-5 py-4">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {rightAction}
      </div>
      <div className="border-t border-gray-100 px-5 py-4">{children}</div>
    </section>
  );
}
