"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, FolderOpen, Eye } from "lucide-react";

interface Batch {
  id: string;
  name: string;
  _count: { participants: number };
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
  batches: Batch[];
  _count: { assessors: number; events: number };
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  // Form state
  const [projectName, setProjectName] = useState<string>("");
  const [projectDescription, setProjectDescription] = useState<string>("");
  const [batchName, setBatchName] = useState<string>("");
  const [alert, setAlert] = useState<{
    type: string;
    message: string;
  }>({ type: "", message: "" });

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data: Project[]) => {
        setProjects(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert({ type: "", message: "" });

    if (!projectName.trim()) {
      setAlert({ type: "error", message: "Project name is required" });
      return;
    }

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName.trim(),
          description: projectDescription.trim() || null,
          batchName: batchName.trim() || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create project");
      }

      // Re-fetch project list to include full data
      const listRes = await fetch("/api/projects");
      const updatedProjects = await listRes.json();
      setProjects(updatedProjects);

      setAlert({ type: "success", message: "Project created successfully" });
      setProjectName("");
      setProjectDescription("");
      setBatchName("");
      setDialogOpen(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create project";
      setAlert({ type: "error", message });
    }
  };

  return (
    <div>
      <nav data-testid="project-page-nav" className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Projects</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your assessment projects
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="new-project-btn">
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
              </DialogHeader>
              <form
                data-testid="project-form"
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div>
                  <label
                    htmlFor="project-name"
                    className="text-sm font-medium text-foreground"
                  >
                    Project Name *
                  </label>
                  <Input
                    id="project-name"
                    data-testid="project-name-input"
                    name="name"
                    placeholder="Enter project name"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="project-description"
                    className="text-sm font-medium text-foreground"
                  >
                    Description
                  </label>
                  <Input
                    id="project-description"
                    data-testid="project-description-input"
                    name="description"
                    placeholder="Enter project description"
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="batch-name"
                    className="text-sm font-medium text-foreground"
                  >
                    Initial Batch Name
                  </label>
                  <Input
                    id="batch-name"
                    data-testid="batch-name-input"
                    name="batchName"
                    placeholder="e.g. Batch 1"
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  data-testid="submit-project-btn"
                  className="w-full"
                >
                  Create Project
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </nav>

      <Separator className="mb-6" />

      {alert.message && (
        <div
          data-testid={
            alert.type === "success"
              ? "project-created-alert"
              : "project-error-alert"
          }
          className={`mb-4 rounded-lg p-3 text-sm ${
            alert.type === "success"
              ? "border border-green-200 bg-green-50 text-green-800"
              : "border border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {alert.message}
        </div>
      )}

      <div data-testid="project-list-container">
        {loading ? (
          <p data-testid="project-list-loading">Loading projects...</p>
        ) : projects.length > 0 ? (
          <div
            data-testid="project-list"
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            {projects.map((project: Project) => (
              <Card
                key={project.id}
                data-testid={`project-item-${project.id}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <Badge
                      variant={
                        project.status === "active" ? "default" : "secondary"
                      }
                    >
                      {project.status}
                    </Badge>
                  </div>
                  {project.description && (
                    <p className="text-sm text-muted-foreground">
                      {project.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>
                      {project.batches.length} batch
                      {project.batches.length !== 1 ? "es" : ""}
                    </span>
                    <span>{project._count.assessors} assessors</span>
                  </div>
                  <Link href={`/admin/projects/${project.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full"
                      data-testid={`view-project-${project.id}-btn`}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div
            data-testid="project-list-empty"
            className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12"
          >
            <FolderOpen className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No projects yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first project to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
