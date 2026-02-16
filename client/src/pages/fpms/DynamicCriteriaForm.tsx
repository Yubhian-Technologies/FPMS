import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { api } from "@/api/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface TaskItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  assessmentCriteria: string;
  evidence: string;
  reference: string;
  marks: number;
  order: number;
}

interface ModuleItem {
  id: string;
  moduleNumber: number;
  moduleName: string;
  totalMarks: number;
  order: number;
  tasks: TaskItem[];
}

interface CriteriaPayload {
  formId: string;
  formTitle: string;
  criteria: {
    id: string;
    criteriaName: string;
    totalMarks: number;
    modules: ModuleItem[];
  };
}

interface TaskProgress {
  claimedScore: number;
  evidenceUrl: string;
  description: string;
}

interface WorkflowTaskStatusItem {
  id: string;
  taskId: string;
  moduleId: string;
  status: TaskWorkflowStatus;
  currentFlow?: string;
  canAppeal?: boolean;
  claimedScore?: number;
  evidenceUrl?: string;
  description?: string;
  submitToRoles?: string[];
  appealToRoles?: string[];
  assignments?: Array<{
    role?: string;
    status?: string;
  }>;
}

type TaskStatus = "pending" | "submitted";
type TaskWorkflowStatus = "pending" | "submitted" | "appealed" | "approved";

export default function DynamicCriteriaForm() {
  const { formId, criteriaId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submittingTaskId, setSubmittingTaskId] = useState<string | null>(null);
  const [appealingTaskId, setAppealingTaskId] = useState<string | null>(null);
  const [submittingModuleId, setSubmittingModuleId] = useState<string | null>(
    null,
  );
  const [payload, setPayload] = useState<CriteriaPayload | null>(null);
  const [taskProgress, setTaskProgress] = useState<
    Record<string, TaskProgress>
  >({});
  const [taskStatuses, setTaskStatuses] = useState<
    Record<string, TaskWorkflowStatus>
  >({});
  const [taskSubmittedRoles, setTaskSubmittedRoles] = useState<
    Record<string, string[]>
  >({});
  const [taskCanAppeal, setTaskCanAppeal] = useState<Record<string, boolean>>(
    {},
  );

  const storageKey = useMemo(() => {
    const userId = user?.id || "anonymous";
    return `fpms-dynamic-progress-${userId}-${formId || ""}-${criteriaId || ""}`;
  }, [user?.id, formId, criteriaId]);

  const initializeProgress = (modules: ModuleItem[]) => {
    const fallback: Record<string, TaskProgress> = {};
    const statusFallback: Record<string, TaskWorkflowStatus> = {};
    modules.forEach((moduleItem) => {
      moduleItem.tasks.forEach((task) => {
        fallback[task.id] = {
          claimedScore: 0,
          evidenceUrl: "",
          description: "",
        };
        statusFallback[task.id] = "pending";
      });
    });

    const parseStoredStatus = (
      value: unknown,
      fallbackValue: TaskWorkflowStatus = "pending",
    ): TaskWorkflowStatus => {
      const normalized = String(value || "")
        .trim()
        .toLowerCase();
      if (
        normalized === "submitted" ||
        normalized === "appealed" ||
        normalized === "approved"
      ) {
        return normalized;
      }
      return fallbackValue;
    };

    try {
      const stored = localStorage.getItem(storageKey);
      const storedSubmitted = localStorage.getItem(`${storageKey}-submitted`);
      const storedStatuses = localStorage.getItem(`${storageKey}-statuses`);
      if (!stored) {
        setTaskProgress(fallback);
        if (storedStatuses) {
          const parsedStatuses = JSON.parse(storedStatuses);
          const mergedStatuses: Record<string, TaskWorkflowStatus> = {};
          Object.keys(statusFallback).forEach((taskId) => {
            mergedStatuses[taskId] = parseStoredStatus(
              parsedStatuses?.[taskId],
            );
          });
          setTaskStatuses(mergedStatuses);
        } else if (storedSubmitted) {
          const parsedSubmitted = JSON.parse(storedSubmitted);
          const mergedStatuses: Record<string, TaskWorkflowStatus> = {};
          Object.keys(statusFallback).forEach((taskId) => {
            mergedStatuses[taskId] = Boolean(parsedSubmitted?.[taskId])
              ? "submitted"
              : "pending";
          });
          setTaskStatuses(mergedStatuses);
        } else {
          setTaskStatuses(statusFallback);
        }
        return;
      }

      const parsed = JSON.parse(stored);
      const merged: Record<string, TaskProgress> = {};

      Object.keys(fallback).forEach((taskId) => {
        const entry = parsed?.[taskId];
        merged[taskId] = {
          claimedScore: Number(entry?.claimedScore || 0),
          evidenceUrl: String(entry?.evidenceUrl || ""),
          description: String(entry?.description || ""),
        };
      });

      setTaskProgress(merged);

      if (storedStatuses) {
        const parsedStatuses = JSON.parse(storedStatuses);
        const mergedStatuses: Record<string, TaskWorkflowStatus> = {};
        Object.keys(statusFallback).forEach((taskId) => {
          mergedStatuses[taskId] = parseStoredStatus(parsedStatuses?.[taskId]);
        });
        setTaskStatuses(mergedStatuses);
      } else if (storedSubmitted) {
        const parsedSubmitted = JSON.parse(storedSubmitted);
        const mergedStatuses: Record<string, TaskWorkflowStatus> = {};
        Object.keys(statusFallback).forEach((taskId) => {
          mergedStatuses[taskId] = Boolean(parsedSubmitted?.[taskId])
            ? "submitted"
            : "pending";
        });
        setTaskStatuses(mergedStatuses);
      } else {
        setTaskStatuses(statusFallback);
      }
    } catch {
      setTaskProgress(fallback);
      setTaskStatuses(statusFallback);
    }
  };

  const fetchCriteriaData = async () => {
    if (!formId || !criteriaId) return;

    setLoading(true);
    try {
      const response = await api.get(
        `/api/committee/forms/${formId}/criteria/${criteriaId}`,
      );
      const data = response.data?.data as CriteriaPayload;
      setPayload(data);
      initializeProgress(data?.criteria?.modules || []);
    } catch (error: any) {
      toast({
        title: "Failed to load criteria",
        description:
          error?.response?.data?.message || "Unable to load modules and tasks.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCriteriaData();
  }, [formId, criteriaId, user?.role]);

  const syncWorkflowStatuses = async () => {
    if (!formId || !criteriaId) return;

    try {
      const res = await api.get(
        "/api/committee/workflow/submissions/my-statuses",
        {
          params: { formId, criteriaId },
        },
      );

      const rows: WorkflowTaskStatusItem[] = Array.isArray(res.data?.data)
        ? res.data.data
        : [];

      if (!rows.length) return;

      const nextStatuses: Record<string, TaskWorkflowStatus> = {};
      const nextSubmittedRoles: Record<string, string[]> = {};
      const nextTaskProgress: Record<string, TaskProgress> = {};
      const nextTaskCanAppeal: Record<string, boolean> = {};

      rows.forEach((item) => {
        const taskId = String(item.taskId || "").trim();
        if (!taskId) return;

        const normalizedStatus = String(item.status || "pending")
          .trim()
          .toLowerCase();

        const mappedStatus: TaskWorkflowStatus =
          normalizedStatus === "approved"
            ? "approved"
            : normalizedStatus === "appealed"
              ? "appealed"
              : normalizedStatus === "submitted"
                ? "submitted"
                : "pending";

        nextStatuses[taskId] = mappedStatus;
        nextTaskCanAppeal[taskId] = Boolean(item.canAppeal);
        nextTaskProgress[taskId] = {
          claimedScore: Number(item.claimedScore || 0),
          evidenceUrl: String(item.evidenceUrl || ""),
          description: String(item.description || ""),
        };

        const rolesFromAssignments = Array.isArray(item.assignments)
          ? item.assignments
              .filter(
                (assignment) =>
                  String(assignment?.status || "") === "submitted",
              )
              .map((assignment) => String(assignment?.role || "").trim())
              .filter(Boolean)
          : [];

        const rolesFromSubmission = Array.isArray(item.submitToRoles)
          ? item.submitToRoles
              .map((role) => String(role || "").trim())
              .filter(Boolean)
          : [];

        const rolesFromAppeal = Array.isArray(item.appealToRoles)
          ? item.appealToRoles
              .map((role) => String(role || "").trim())
              .filter(Boolean)
          : [];

        nextSubmittedRoles[taskId] =
          mappedStatus === "appealed"
            ? rolesFromAssignments.length > 0
              ? rolesFromAssignments
              : rolesFromAppeal
            : rolesFromAssignments.length > 0
              ? rolesFromAssignments
              : rolesFromSubmission;
      });

      setTaskStatuses((prev) => ({ ...prev, ...nextStatuses }));
      setTaskSubmittedRoles((prev) => ({ ...prev, ...nextSubmittedRoles }));
      setTaskProgress((prev) => ({ ...prev, ...nextTaskProgress }));
      setTaskCanAppeal((prev) => ({ ...prev, ...nextTaskCanAppeal }));
    } catch {
      // silent fallback to local statuses
    }
  };

  useEffect(() => {
    syncWorkflowStatuses();
  }, [formId, criteriaId, user?.id]);

  const allTasks = useMemo(() => {
    if (!payload) return [] as TaskItem[];
    return payload.criteria.modules.flatMap((moduleItem) => moduleItem.tasks);
  }, [payload]);

  const totalMaxMarks = useMemo(() => {
    return allTasks.reduce((sum, task) => sum + Number(task.marks || 0), 0);
  }, [allTasks]);

  const totalClaimedMarks = useMemo(() => {
    return allTasks.reduce((sum, task) => {
      const value = Number(taskProgress[task.id]?.claimedScore || 0);
      const bounded = Math.max(0, Math.min(value, Number(task.marks || 0)));
      return sum + bounded;
    }, 0);
  }, [allTasks, taskProgress]);

  const completedTasks = useMemo(() => {
    return allTasks.filter(
      (task) => String(taskStatuses[task.id] || "pending") !== "pending",
    ).length;
  }, [allTasks, taskStatuses]);

  const submittedCount = useMemo(
    () =>
      allTasks.filter((task) => taskStatuses[task.id] === "submitted").length,
    [allTasks, taskStatuses],
  );

  const appealedCount = useMemo(
    () =>
      allTasks.filter((task) => taskStatuses[task.id] === "appealed").length,
    [allTasks, taskStatuses],
  );

  const approvedCount = useMemo(
    () =>
      allTasks.filter((task) => taskStatuses[task.id] === "approved").length,
    [allTasks, taskStatuses],
  );

  const progressPercent = useMemo(() => {
    if (!allTasks.length) return 0;
    return Math.round((completedTasks / allTasks.length) * 100);
  }, [allTasks.length, completedTasks]);

  const getTaskStatus = (taskId: string): TaskWorkflowStatus => {
    return taskStatuses[taskId] || "pending";
  };

  const isTaskFrozen = (taskId: string) => getTaskStatus(taskId) !== "pending";

  const isModuleFrozen = (moduleItem: ModuleItem) =>
    moduleItem.tasks.every((task) => isTaskFrozen(task.id));

  const getModuleClaimed = (moduleItem: ModuleItem) =>
    moduleItem.tasks.reduce((sum, task) => {
      const value = Number(taskProgress[task.id]?.claimedScore || 0);
      const bounded = Math.max(0, Math.min(value, Number(task.marks || 0)));
      return sum + bounded;
    }, 0);

  const getModuleStatus = (moduleItem: ModuleItem) => {
    const submittedCount = moduleItem.tasks.filter(
      (task) => getTaskStatus(task.id) === "submitted",
    ).length;
    if (submittedCount === 0) return "not-started";
    if (submittedCount === moduleItem.tasks.length) return "completed";
    return "in-progress";
  };

  const updateTaskProgress = (taskId: string, patch: Partial<TaskProgress>) => {
    setTaskProgress((prev) => ({
      ...prev,
      [taskId]: {
        claimedScore: prev[taskId]?.claimedScore || 0,
        evidenceUrl: prev[taskId]?.evidenceUrl || "",
        description: prev[taskId]?.description || "",
        ...patch,
      },
    }));
  };

  const clampClaimedScore = (value: number, maxMarks: number) => {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(value, Number(maxMarks || 0)));
  };

  const saveProgress = async () => {
    try {
      setSaving(true);
      localStorage.setItem(storageKey, JSON.stringify(taskProgress));
      localStorage.setItem(
        `${storageKey}-statuses`,
        JSON.stringify(taskStatuses),
      );
      localStorage.setItem(
        `${storageKey}-submitted`,
        JSON.stringify(
          Object.fromEntries(
            Object.entries(taskStatuses).map(([taskId, status]) => [
              taskId,
              status !== "pending",
            ]),
          ),
        ),
      );
      toast({
        title: "Progress saved",
        description: "Your task progress was saved locally.",
      });
    } finally {
      setSaving(false);
    }
  };

  const submitTask = async (moduleItem: ModuleItem, task: TaskItem) => {
    try {
      if (isTaskFrozen(task.id)) {
        toast({
          title: "Task already submitted",
          description: "Submitted tasks are locked for editing.",
        });
        return;
      }

      setSubmittingTaskId(task.id);
      const progress = taskProgress[task.id] || {
        claimedScore: 0,
        evidenceUrl: "",
        description: "",
      };

      localStorage.setItem(
        `${storageKey}-task-${task.id}`,
        JSON.stringify(progress),
      );

      const submitRes = await api.post(
        "/api/committee/workflow/submissions/task",
        {
          formId,
          criteriaId,
          moduleId: moduleItem.id,
          moduleName: moduleItem.moduleName,
          taskId: task.id,
          taskTitle: task.title,
          claimedScore: progress.claimedScore,
          maxMarks: Number(task.marks || 0),
          evidenceUrl: progress.evidenceUrl,
          description: progress.description,
        },
      );

      const submitToRoles = Array.isArray(submitRes.data?.data?.submitToRoles)
        ? submitRes.data.data.submitToRoles
            .map((role: string) => String(role || "").trim())
            .filter(Boolean)
        : [];

      const nextStatuses = {
        ...taskStatuses,
        [task.id]: "submitted" as TaskWorkflowStatus,
      };
      setTaskStatuses(nextStatuses);
      setTaskSubmittedRoles((prev) => ({
        ...prev,
        [task.id]: submitToRoles,
      }));
      localStorage.setItem(
        `${storageKey}-statuses`,
        JSON.stringify(nextStatuses),
      );
      localStorage.setItem(
        `${storageKey}-submitted`,
        JSON.stringify(
          Object.fromEntries(
            Object.entries(nextStatuses).map(([currentTaskId, status]) => [
              currentTaskId,
              status !== "pending",
            ]),
          ),
        ),
      );

      toast({
        title: "Task submitted",
        description:
          submitToRoles.length > 0
            ? `${task.title || "Task"} submitted to ${submitToRoles.join(", ")}.`
            : `${task.title || "Task"} submitted successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Task submission failed",
        description:
          error?.response?.data?.message ||
          "Unable to submit task. Please check workflow roles.",
        variant: "destructive",
      });
    } finally {
      setSubmittingTaskId(null);
    }
  };

  const submitModuleSection = async (moduleItem: ModuleItem) => {
    try {
      if (isModuleFrozen(moduleItem)) {
        toast({
          title: "Section already submitted",
          description: "All tasks in this section are already locked.",
        });
        return;
      }

      setSubmittingModuleId(moduleItem.id);

      const modulePayload = moduleItem.tasks.reduce(
        (acc, task) => {
          acc[task.id] = taskProgress[task.id] || {
            claimedScore: 0,
            evidenceUrl: "",
            description: "",
          };
          return acc;
        },
        {} as Record<string, TaskProgress>,
      );

      localStorage.setItem(
        `${storageKey}-module-${moduleItem.id}`,
        JSON.stringify(modulePayload),
      );

      const nextStatuses = { ...taskStatuses };
      const nextSubmittedRoles = { ...taskSubmittedRoles };

      for (const task of moduleItem.tasks) {
        if (isTaskFrozen(task.id)) {
          continue;
        }

        const progress = taskProgress[task.id] || {
          claimedScore: 0,
          evidenceUrl: "",
          description: "",
        };

        const submitRes = await api.post(
          "/api/committee/workflow/submissions/task",
          {
            formId,
            criteriaId,
            moduleId: moduleItem.id,
            moduleName: moduleItem.moduleName,
            taskId: task.id,
            taskTitle: task.title,
            claimedScore: progress.claimedScore,
            maxMarks: Number(task.marks || 0),
            evidenceUrl: progress.evidenceUrl,
            description: progress.description,
          },
        );

        const submitToRoles = Array.isArray(submitRes.data?.data?.submitToRoles)
          ? submitRes.data.data.submitToRoles
              .map((role: string) => String(role || "").trim())
              .filter(Boolean)
          : [];

        nextSubmittedRoles[task.id] = submitToRoles;
        nextStatuses[task.id] = "submitted";
      }

      moduleItem.tasks.forEach((task) => {
        nextStatuses[task.id] = "submitted";
      });
      setTaskStatuses(nextStatuses);
      setTaskSubmittedRoles(nextSubmittedRoles);
      localStorage.setItem(
        `${storageKey}-statuses`,
        JSON.stringify(nextStatuses),
      );
      localStorage.setItem(
        `${storageKey}-submitted`,
        JSON.stringify(
          Object.fromEntries(
            Object.entries(nextStatuses).map(([taskId, status]) => [
              taskId,
              status !== "pending",
            ]),
          ),
        ),
      );

      toast({
        title: "Section submitted",
        description: `${moduleItem.moduleName} submitted to workflow roles successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Section submission failed",
        description:
          error?.response?.data?.message ||
          "Unable to submit section. Please check workflow roles.",
        variant: "destructive",
      });
    } finally {
      setSubmittingModuleId(null);
    }
  };

  const submitTaskAppeal = async (moduleItem: ModuleItem, task: TaskItem) => {
    try {
      const taskStatus = getTaskStatus(task.id);
      if (taskStatus === "appealed") {
        toast({
          title: "Appeal already submitted",
          description: "This task is already in appeal workflow.",
        });
        return;
      }

      if (
        !taskCanAppeal[task.id] &&
        taskStatus !== "submitted" &&
        taskStatus !== "approved"
      ) {
        toast({
          title: "Appeal not allowed",
          description: "This task is not eligible for appeal yet.",
          variant: "destructive",
        });
        return;
      }

      const reason = window.prompt("Enter appeal reason");
      if (reason === null) return;

      setAppealingTaskId(task.id);

      const progress = taskProgress[task.id] || {
        claimedScore: 0,
        evidenceUrl: "",
        description: "",
      };

      const response = await api.post(
        "/api/committee/workflow/submissions/task/appeal",
        {
          formId,
          criteriaId,
          moduleId: moduleItem.id,
          taskId: task.id,
          reason,
          requestedScore: progress.claimedScore,
        },
      );

      const appealToRoles = Array.isArray(response.data?.data?.appealToRoles)
        ? response.data.data.appealToRoles
            .map((role: string) => String(role || "").trim())
            .filter(Boolean)
        : [];

      setTaskStatuses((prev) => ({ ...prev, [task.id]: "appealed" }));
      setTaskSubmittedRoles((prev) => ({
        ...prev,
        [task.id]: appealToRoles,
      }));
      setTaskCanAppeal((prev) => ({ ...prev, [task.id]: false }));

      toast({
        title: "Appeal submitted",
        description:
          appealToRoles.length > 0
            ? `Appeal submitted to ${appealToRoles.join(", ")}.`
            : "Appeal submitted successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Appeal submission failed",
        description:
          error?.response?.data?.message ||
          "Unable to submit appeal for this task.",
        variant: "destructive",
      });
    } finally {
      setAppealingTaskId(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Loading...">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading modules and tasks...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!payload) {
    return (
      <DashboardLayout title="FPMS Form">
        <div className="text-center text-muted-foreground py-16">
          No criteria data found.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={
        payload.criteria.criteriaName || payload.formTitle || "FPMS Criteria"
      }
      subtitle={`${payload.formTitle} • Maximum ${payload.criteria.totalMarks || totalMaxMarks} Points`}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Overall Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative group w-full h-4 rounded-full flex overflow-hidden">
              <div
                className="bg-emerald-600 h-4 transition-all"
                style={{
                  width: `${allTasks.length ? (approvedCount / allTasks.length) * 100 : 0}%`,
                }}
              />
              <div
                className="bg-amber-500 h-4 transition-all"
                style={{
                  width: `${allTasks.length ? (appealedCount / allTasks.length) * 100 : 0}%`,
                }}
              />
              <div
                className="bg-blue-600 h-4 transition-all"
                style={{
                  width: `${allTasks.length ? (submittedCount / allTasks.length) * 100 : 0}%`,
                }}
              />
              <div className="bg-gray-200 h-4 flex-1" />
              <div className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium mix-blend-difference pointer-events-none">
                {progressPercent}%
              </div>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                {totalClaimedMarks} / {totalMaxMarks} Points
              </span>
              <span>
                Submitted: {completedTasks} • Tasks: {allTasks.length}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="inline-flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                <span className="text-muted-foreground">
                  Submitted: {submittedCount}
                </span>
              </div>
              <div className="inline-flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <span className="text-muted-foreground">
                  Appealed: {appealedCount}
                </span>
              </div>
              <div className="inline-flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                <span className="text-muted-foreground">
                  Approved: {approvedCount}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Accordion type="single" collapsible className="space-y-4">
          {payload.criteria.modules.map((moduleItem) => (
            <AccordionItem
              key={moduleItem.id}
              value={moduleItem.id}
              className="border rounded-lg"
            >
              <AccordionTrigger className="px-5 py-4">
                <div className="flex w-full justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="px-3 py-1">
                      {moduleItem.moduleNumber || "M"}
                    </Badge>
                    <span className="font-semibold text-lg">
                      {moduleItem.moduleName}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      Max: {moduleItem.totalMarks}
                    </span>
                    {getModuleStatus(moduleItem) === "completed" ? (
                      <Badge className="bg-blue-800 text-white">
                        Submitted
                      </Badge>
                    ) : getModuleStatus(moduleItem) === "in-progress" ? (
                      <Badge variant="secondary">In Progress</Badge>
                    ) : (
                      <Badge variant="destructive">Not Started</Badge>
                    )}
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-5 pb-6 pt-4 space-y-6">
                {moduleItem.tasks.map((task) => {
                  const progress = taskProgress[task.id] || {
                    claimedScore: 0,
                    evidenceUrl: "",
                    description: "",
                  };
                  const taskStatus = getTaskStatus(task.id);
                  const taskFrozen = isTaskFrozen(task.id);

                  return (
                    <Card key={task.id} className="border">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <CardTitle className="text-lg">
                              {task.title || "Task"}
                            </CardTitle>
                            {task.subtitle ? (
                              <p className="text-sm text-muted-foreground italic">
                                {task.subtitle}
                              </p>
                            ) : null}
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            {taskStatus === "approved" ? (
                              <Badge className="bg-emerald-600 text-white">
                                Approved
                              </Badge>
                            ) : taskStatus === "appealed" ? (
                              <Badge className="bg-amber-500 text-white">
                                Appealed
                              </Badge>
                            ) : taskStatus === "submitted" ? (
                              <Badge variant="secondary">Submitted</Badge>
                            ) : (
                              <Badge variant="outline">Pending</Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              Max: {task.marks}
                            </span>
                            {Array.isArray(taskSubmittedRoles[task.id]) &&
                            taskSubmittedRoles[task.id].length > 0 ? (
                              <span className="text-[11px] text-blue-700 text-right max-w-[220px]">
                                {taskStatus === "appealed"
                                  ? "Appealed to"
                                  : "Submitted to"}
                                : {taskSubmittedRoles[task.id].join(", ")}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {task.description ? (
                            <div className="bg-blue-50 p-3 rounded border border-blue-200">
                              <h5 className="font-medium text-blue-900 text-sm mb-1">
                                Description
                              </h5>
                              <p className="text-sm text-gray-700 whitespace-pre-line">
                                {task.description}
                              </p>
                            </div>
                          ) : null}

                          {task.assessmentCriteria ? (
                            <div className="bg-green-50 p-3 rounded border border-green-200">
                              <h5 className="font-medium text-green-900 text-sm mb-1">
                                Assessment Criteria
                              </h5>
                              <p className="text-sm text-gray-700 whitespace-pre-line">
                                {task.assessmentCriteria}
                              </p>
                            </div>
                          ) : null}

                          {task.evidence ? (
                            <div className="bg-amber-50 p-3 rounded border border-amber-200">
                              <h5 className="font-medium text-amber-900 text-sm mb-1">
                                Required Evidence
                              </h5>
                              <p className="text-sm text-gray-700 whitespace-pre-line">
                                {task.evidence}
                              </p>
                            </div>
                          ) : null}

                          {task.reference ? (
                            <div className="bg-purple-50 p-3 rounded border border-purple-200">
                              <h5 className="font-medium text-purple-900 text-sm mb-1">
                                Reference
                              </h5>
                              <p className="text-sm text-gray-700 whitespace-pre-line">
                                {task.reference}
                              </p>
                            </div>
                          ) : null}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div>
                            <label className="text-sm font-medium block mb-1.5">
                              Claimed Score
                            </label>
                            {taskFrozen ? (
                              <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm font-medium">
                                {progress.claimedScore} / {task.marks}
                              </div>
                            ) : (
                              <Input
                                type="number"
                                min={0}
                                max={task.marks}
                                value={progress.claimedScore}
                                className="w-full"
                                onChange={(e) =>
                                  updateTaskProgress(task.id, {
                                    claimedScore: clampClaimedScore(
                                      Number(e.target.value || 0),
                                      task.marks,
                                    ),
                                  })
                                }
                              />
                            )}
                          </div>

                          <div>
                            <label className="text-sm font-medium block mb-1.5">
                              Evidence URL
                            </label>
                            {taskFrozen ? (
                              <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm break-all">
                                {progress.evidenceUrl || "No evidence provided"}
                              </div>
                            ) : (
                              <Input
                                value={progress.evidenceUrl}
                                className="w-full"
                                onChange={(e) =>
                                  updateTaskProgress(task.id, {
                                    evidenceUrl: e.target.value,
                                  })
                                }
                                placeholder="Paste supporting link"
                              />
                            )}
                          </div>

                          <div className="md:col-span-2">
                            <label className="text-sm font-medium block mb-1.5">
                              Faculty Description
                            </label>
                            {taskFrozen ? (
                              <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm min-h-[100px] whitespace-pre-wrap">
                                {progress.description ||
                                  "No description provided"}
                              </div>
                            ) : (
                              <Textarea
                                value={progress.description}
                                onChange={(e) =>
                                  updateTaskProgress(task.id, {
                                    description: e.target.value,
                                  })
                                }
                                className="w-full min-h-[100px]"
                                placeholder="Explain how this task is satisfied..."
                                rows={4}
                              />
                            )}
                          </div>
                        </div>

                        <div className="flex justify-end pt-1">
                          <div className="flex items-center gap-2">
                            {(taskCanAppeal[task.id] ||
                              taskStatus === "submitted" ||
                              taskStatus === "approved") &&
                            taskStatus !== "appealed" ? (
                              <Button
                                variant="outline"
                                onClick={() =>
                                  submitTaskAppeal(moduleItem, task)
                                }
                                disabled={appealingTaskId === task.id}
                              >
                                {appealingTaskId === task.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : null}
                                {appealingTaskId === task.id
                                  ? "Appealing..."
                                  : "Appeal Task"}
                              </Button>
                            ) : null}
                            <Button
                              onClick={() => submitTask(moduleItem, task)}
                              disabled={
                                submittingTaskId === task.id || taskFrozen
                              }
                            >
                              {submittingTaskId === task.id ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : null}
                              {taskFrozen
                                ? "Submitted"
                                : submittingTaskId === task.id
                                  ? "Submitting..."
                                  : "Submit Task"}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                <div className="flex justify-end pt-2">
                  <Button
                    onClick={() => submitModuleSection(moduleItem)}
                    disabled={
                      submittingModuleId === moduleItem.id ||
                      isModuleFrozen(moduleItem)
                    }
                  >
                    {submittingModuleId === moduleItem.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {isModuleFrozen(moduleItem)
                      ? "Section Submitted"
                      : submittingModuleId === moduleItem.id
                        ? "Submitting..."
                        : "Submit Section"}
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="flex justify-end">
          <Button onClick={saveProgress} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {saving ? "Saving..." : "Save Progress"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
