"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Send,
  UserPlus,
  RefreshCw,
  Users,
  ClipboardCheck,
} from "lucide-react";

interface Invitation {
  id: string;
  participantId: string;
  status: string;
  sentAt: string | null;
  expiresAt: string | null;
}

interface Participant {
  id: string;
  name: string;
  email: string;
  batchId: string;
  invitation: Invitation | null;
}

interface Batch {
  id: string;
  name: string;
  participants: Participant[];
}

interface MasterAssessorRef {
  id: string;
  name: string;
  email: string;
}

interface ProjectAssessor {
  id: string;
  masterAssessorId: string;
  masterAssessor: MasterAssessorRef;
  createdAt: string;
}

interface ProjectEvent {
  id: string;
  type: string;
  payload: string | null;
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  batches: Batch[];
  assessors: ProjectAssessor[];
  events: ProjectEvent[];
}

interface MasterAssessor {
  id: string;
  name: string;
  email: string;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [masterAssessors, setMasterAssessors] = useState<MasterAssessor[]>([]);
  const [selectedAssessor, setSelectedAssessor] = useState<string>("");
  const [alert, setAlert] = useState<{ type: string; message: string }>({
    type: "",
    message: "",
  });

  // Add participant form
  const [participantName, setParticipantName] = useState<string>("");
  const [participantEmail, setParticipantEmail] = useState<string>("");
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      const data = await res.json();
      setProject(data);
      if (data.batches?.length > 0 && !selectedBatchId) {
        setSelectedBatchId(data.batches[0].id);
      }
    } catch {
      console.error("Failed to fetch project");
    } finally {
      setLoading(false);
    }
  }, [projectId, selectedBatchId]);

  useEffect(() => {
    fetchProject();
    fetch("/api/master-assessors")
      .then((r) => r.json())
      .then((data: MasterAssessor[]) => setMasterAssessors(data))
      .catch(() => {});
  }, [fetchProject]);

  const handleSendInvitations = async () => {
    setAlert({ type: "", message: "" });
    try {
      const res = await fetch(`/api/projects/${projectId}/invitations`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAlert({ type: "success", message: data.message });
      fetchProject();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to send invitations";
      setAlert({ type: "error", message });
    }
  };

  const handleResendInvitation = async (participantId: string) => {
    setAlert({ type: "", message: "" });
    try {
      const res = await fetch(`/api/projects/${projectId}/invitations`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAlert({ type: "success", message: "Invitation resent successfully" });
      fetchProject();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to resend invitation";
      setAlert({ type: "error", message });
    }
  };

  const handleAssignAssessor = async () => {
    setAlert({ type: "", message: "" });
    if (!selectedAssessor) {
      setAlert({ type: "error", message: "Please select an assessor" });
      return;
    }
    try {
      const res = await fetch(`/api/projects/${projectId}/assessors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ masterAssessorId: selectedAssessor }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAlert({
        type: "success",
        message: `Assessor "${data.masterAssessor.name}" assigned successfully`,
      });
      setSelectedAssessor("");
      fetchProject();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to assign assessor";
      setAlert({ type: "error", message });
    }
  };

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert({ type: "", message: "" });

    if (!participantName.trim() || !participantEmail.trim()) {
      setAlert({
        type: "error",
        message: "Participant name and email are required",
      });
      return;
    }
    if (!selectedBatchId) {
      setAlert({ type: "error", message: "Please select a batch" });
      return;
    }

    try {
      const res = await fetch(
        `/api/projects/${projectId}/batches/${selectedBatchId}/participants`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: participantName.trim(),
            email: participantEmail.trim(),
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAlert({
        type: "success",
        message: "Participant added successfully",
      });
      setParticipantName("");
      setParticipantEmail("");
      fetchProject();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to add participant";
      setAlert({ type: "error", message });
    }
  };

  if (loading) {
    return (
      <p data-testid="project-detail-loading">Loading project details...</p>
    );
  }

  if (!project) {
    return <p>Project not found</p>;
  }

  const allParticipants = project.batches.flatMap((b) => b.participants);

  // Filter available assessors (not yet assigned)
  const assignedIds = new Set(
    project.assessors.map((a) => a.masterAssessorId)
  );
  const availableAssessors = masterAssessors.filter(
    (a) => !assignedIds.has(a.id)
  );

  return (
    <div data-testid="project-detail-container">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin/projects">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
          <Badge
            variant={project.status === "active" ? "default" : "secondary"}
          >
            {project.status}
          </Badge>
        </div>
        {project.description && (
          <p className="mt-1 text-sm text-muted-foreground">
            {project.description}
          </p>
        )}
      </div>

      {alert.message && (
        <div
          data-testid={
            alert.type === "success"
              ? "project-success-alert"
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

      <Tabs defaultValue="participants" className="space-y-4">
        <TabsList>
          <TabsTrigger value="participants">
            <Users className="mr-2 h-4 w-4" />
            Participants ({allParticipants.length})
          </TabsTrigger>
          <TabsTrigger value="assessors" data-testid="assessors-tab">
            <ClipboardCheck className="mr-2 h-4 w-4" />
            Assessors ({project.assessors.length})
          </TabsTrigger>
          <TabsTrigger value="events">Events ({project.events.length})</TabsTrigger>
        </TabsList>

        {/* Participants Tab */}
        <TabsContent value="participants" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Participants & Invitations</h2>
            <Button
              data-testid="send-invitations-btn"
              onClick={handleSendInvitations}
              disabled={allParticipants.length === 0}
            >
              <Send className="mr-2 h-4 w-4" />
              Send Invitations
            </Button>
          </div>

          {/* Add Participant Form */}
          {project.batches.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Add Participant</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  data-testid="add-participant-form"
                  onSubmit={handleAddParticipant}
                  className="flex flex-wrap items-end gap-3"
                >
                  <div className="flex-1">
                    <label
                      htmlFor="participant-name"
                      className="text-xs font-medium"
                    >
                      Name
                    </label>
                    <Input
                      id="participant-name"
                      data-testid="participant-name-input"
                      name="participantName"
                      placeholder="Participant name"
                      value={participantName}
                      onChange={(e) => setParticipantName(e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <label
                      htmlFor="participant-email"
                      className="text-xs font-medium"
                    >
                      Email
                    </label>
                    <Input
                      id="participant-email"
                      data-testid="participant-email-input"
                      name="participantEmail"
                      type="email"
                      placeholder="email@example.com"
                      value={participantEmail}
                      onChange={(e) => setParticipantEmail(e.target.value)}
                    />
                  </div>
                  <div className="w-40">
                    <label
                      htmlFor="batch-select"
                      className="text-xs font-medium"
                    >
                      Batch
                    </label>
                    <Select
                      value={selectedBatchId}
                      onValueChange={setSelectedBatchId}
                    >
                      <SelectTrigger data-testid="batch-select">
                        <SelectValue placeholder="Select batch" />
                      </SelectTrigger>
                      <SelectContent>
                        {project.batches.map((batch: Batch) => (
                          <SelectItem key={batch.id} value={batch.id}>
                            {batch.name} ({batch.participants.length}/20)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="submit"
                    data-testid="add-participant-btn"
                    size="sm"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Participants List by Batch */}
          <div data-testid="participant-list-container">
            {project.batches.map((batch: Batch) => (
              <Card key={batch.id} className="mb-4">
                <CardHeader>
                  <CardTitle className="text-sm">
                    {batch.name}{" "}
                    <Badge variant="outline">
                      {batch.participants.length}/20 participants
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {batch.participants.length === 0 ? (
                    <p
                      data-testid={`batch-${batch.id}-empty`}
                      className="text-sm text-muted-foreground"
                    >
                      No participants in this batch
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {batch.participants.map(
                        (participant: Participant) => (
                          <div
                            key={participant.id}
                            data-testid={`participant-item-${participant.id}`}
                            className="flex items-center justify-between rounded-lg border p-3"
                          >
                            <div>
                              <p className="text-sm font-medium">
                                {participant.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {participant.email}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {participant.invitation ? (
                                <>
                                  <Badge
                                    variant={
                                      participant.invitation.status === "sent"
                                        ? "default"
                                        : participant.invitation.status ===
                                            "expired"
                                          ? "destructive"
                                          : "secondary"
                                    }
                                    data-testid={`invitation-status-${participant.id}`}
                                  >
                                    {participant.invitation.status}
                                  </Badge>
                                  {participant.invitation.status ===
                                    "expired" && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      data-testid={`resend-invitation-${participant.id}-btn`}
                                      onClick={() =>
                                        handleResendInvitation(participant.id)
                                      }
                                    >
                                      <RefreshCw className="mr-1 h-3 w-3" />
                                      Resend
                                    </Button>
                                  )}
                                </>
                              ) : (
                                <Badge variant="outline">No invitation</Badge>
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Assessors Tab */}
        <TabsContent value="assessors" className="space-y-4">
          <h2 className="text-lg font-semibold">Assigned Assessors</h2>

          {/* Assign Assessor Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Assign Assessor</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                data-testid="assign-assessor-form"
                className="flex items-end gap-3"
              >
                <div className="flex-1">
                  <label
                    htmlFor="assessor-select"
                    className="text-xs font-medium"
                  >
                    Select from Master Data
                  </label>
                  <Select
                    value={selectedAssessor}
                    onValueChange={setSelectedAssessor}
                  >
                    <SelectTrigger data-testid="assessor-select">
                      <SelectValue placeholder="Select assessor" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableAssessors.map(
                        (assessor: MasterAssessor) => (
                          <SelectItem key={assessor.id} value={assessor.id}>
                            {assessor.name} ({assessor.email})
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  data-testid="assign-assessor-btn"
                  onClick={handleAssignAssessor}
                  disabled={!selectedAssessor}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Assign
                </Button>
              </div>
              {masterAssessors.length === 0 && (
                <p
                  data-testid="no-master-data-alert"
                  className="mt-2 text-sm text-red-600"
                >
                  No master assessor data available. Please set up master data
                  first.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Assigned Assessors List */}
          <div data-testid="assessor-list-container">
            {project.assessors.length === 0 ? (
              <p
                data-testid="assessor-list-empty"
                className="text-sm text-muted-foreground"
              >
                No assessors assigned yet
              </p>
            ) : (
              <div className="space-y-2">
                {project.assessors.map(
                  (assessor: ProjectAssessor) => (
                    <div
                      key={assessor.id}
                      data-testid={`assessor-item-${assessor.id}`}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {assessor.masterAssessor.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {assessor.masterAssessor.email}
                        </p>
                      </div>
                      <Badge variant="default">Assigned</Badge>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <h2 className="text-lg font-semibold">Project Events</h2>
          <div data-testid="event-list-container">
            {project.events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events yet</p>
            ) : (
              <div className="space-y-2">
                {project.events.map((event: ProjectEvent) => (
                  <div
                    key={event.id}
                    data-testid={`event-item-${event.id}`}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <Badge variant="outline">{event.type}</Badge>
                      {event.payload && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {JSON.parse(event.payload).message}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
