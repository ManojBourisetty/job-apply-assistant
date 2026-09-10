"use client";

import * as React from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { APPLICATION_STATUS_GROUPS, type ApplicationStatus } from "@/lib/constants";
import { sponsorshipBadgeVariant, statusLabel, formatSalary } from "@/lib/format";
import { updateApplicationStatus } from "@/lib/actions/applications";

export type KanbanApplication = {
  id: string;
  status: ApplicationStatus;
  follow_up_date: string | null;
  job: {
    id: string;
    title: string;
    company_name: string;
    sponsorship_status: string;
    salary_min: number | null;
    salary_max: number | null;
  } | null;
};

function ApplicationCard({ app, isOverlay }: { app: KanbanApplication; isOverlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: app.id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={isDragging && !isOverlay ? "opacity-30" : undefined}
    >
      <Card className="cursor-grab gap-2 p-3 shadow-sm active:cursor-grabbing">
        <Link
          href={`/applications/${app.id}`}
          onClick={(e) => isOverlay && e.preventDefault()}
          className="block"
        >
          <p className="text-sm font-medium leading-tight">{app.job?.title ?? "Untitled role"}</p>
          <p className="text-xs text-muted-foreground">{app.job?.company_name}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {app.job && (
              <Badge variant={sponsorshipBadgeVariant(app.job.sponsorship_status)} className="text-[10px]">
                {statusLabel(app.job.sponsorship_status)}
              </Badge>
            )}
            {formatSalary(app.job?.salary_min, app.job?.salary_max) && (
              <Badge variant="outline" className="text-[10px]">
                {formatSalary(app.job?.salary_min, app.job?.salary_max)}
              </Badge>
            )}
          </div>
          {app.follow_up_date && (
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Follow up {app.follow_up_date}
            </p>
          )}
        </Link>
      </Card>
    </div>
  );
}

function Column({
  status,
  title,
  apps,
}: {
  status: ApplicationStatus;
  title: string;
  apps: KanbanApplication[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex w-[85vw] shrink-0 snap-start flex-col rounded-lg border bg-muted/30 sm:w-72 ${
        isOver ? "ring-2 ring-primary" : ""
      }`}
    >
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-sm font-medium">{title}</span>
        <Badge variant="secondary">{apps.length}</Badge>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-2" style={{ minHeight: 80 }}>
        {apps.map((app) => (
          <ApplicationCard key={app.id} app={app} />
        ))}
      </div>
    </div>
  );
}

export function KanbanBoard({ initialApplications }: { initialApplications: KanbanApplication[] }) {
  const [applications, setApplications] = React.useState(initialApplications);
  const [prevInitialApplications, setPrevInitialApplications] = React.useState(initialApplications);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  if (initialApplications !== prevInitialApplications) {
    setPrevInitialApplications(initialApplications);
    setApplications(initialApplications);
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const applicationId = String(active.id);
    const newStatus = over.id as ApplicationStatus;
    const current = applications.find((a) => a.id === applicationId);
    if (!current || current.status === newStatus) return;

    const previous = current.status;
    setApplications((prev) =>
      prev.map((a) => (a.id === applicationId ? { ...a, status: newStatus } : a))
    );

    updateApplicationStatus(applicationId, newStatus).catch(() => {
      setApplications((prev) =>
        prev.map((a) => (a.id === applicationId ? { ...a, status: previous } : a))
      );
      toast.error("Couldn't update status.");
    });
  }

  const activeApp = applications.find((a) => a.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <p className="mb-2 text-xs text-muted-foreground sm:hidden">
        Swipe sideways to see every stage →
      </p>
      <div className="flex snap-x snap-proximity gap-3 overflow-x-auto pb-4">
        {APPLICATION_STATUS_GROUPS.map((group) => (
          <Column
            key={group.id}
            status={group.id}
            title={group.title}
            apps={applications.filter((a) => a.status === group.id)}
          />
        ))}
      </div>
      <DragOverlay>{activeApp ? <ApplicationCard app={activeApp} isOverlay /> : null}</DragOverlay>
    </DndContext>
  );
}
