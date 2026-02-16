import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Briefcase, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { api } from "@/api/api";
import DeleteConfirmationDialog from "@/components/DeleteConfirmationDialog";

interface DesignationPayload {
  college: string;
  designations: string[];
}

export default function Designations() {
  const [collegeName, setCollegeName] = useState("");
  const [designations, setDesignations] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingDesignation, setIsAddingDesignation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingDesignation, setEditingDesignation] = useState<string | null>(
    null,
  );
  const [designationToDelete, setDesignationToDelete] = useState<string | null>(
    null,
  );
  const [formDesignationName, setFormDesignationName] = useState("");

  const filteredDesignations = useMemo(
    () =>
      designations.filter((item) =>
        item.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [designations, searchQuery],
  );

  const fetchDesignations = async () => {
    try {
      const res = await api.get("/api/hod/designations");
      const data: DesignationPayload = res.data?.data || {
        college: "",
        designations: [],
      };

      setCollegeName(String(data.college || "").trim());
      setDesignations(
        Array.isArray(data.designations)
          ? data.designations
              .map((item) => String(item || "").trim())
              .filter(Boolean)
          : [],
      );
    } catch {
      toast({ title: "Failed to load designations", variant: "destructive" });
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        await fetchDesignations();
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const resetForm = () => {
    setFormDesignationName("");
    setEditingDesignation(null);
  };

  const startAddDesignation = () => {
    resetForm();
    setIsAddingDesignation(true);
  };

  const cancelForm = () => {
    setIsAddingDesignation(false);
    resetForm();
  };

  const openEdit = (designation: string) => {
    setFormDesignationName(designation);
    setEditingDesignation(designation);
    setIsAddingDesignation(true);
  };

  const persistDesignations = async (nextDesignations: string[]) => {
    await api.put("/api/hod/designations", {
      designations: nextDesignations,
    });
  };

  const handleSave = async () => {
    const normalizedDesignationName = String(formDesignationName || "").trim();

    if (!normalizedDesignationName) {
      toast({ title: "Designation name is required", variant: "destructive" });
      return;
    }

    const existingMap = new Map(
      designations.map((item) => [item.toLowerCase(), item]),
    );
    const currentEditingKey = String(editingDesignation || "").toLowerCase();

    if (
      existingMap.has(normalizedDesignationName.toLowerCase()) &&
      normalizedDesignationName.toLowerCase() !== currentEditingKey
    ) {
      toast({
        title: "Designation already exists",
        variant: "destructive",
      });
      return;
    }

    const nextDesignations = editingDesignation
      ? designations.map((item) =>
          item.toLowerCase() === currentEditingKey
            ? normalizedDesignationName
            : item,
        )
      : [...designations, normalizedDesignationName];

    setIsSaving(true);
    try {
      await persistDesignations(nextDesignations);
      toast({
        title: editingDesignation
          ? "Designation updated successfully"
          : "Designation added successfully",
      });
      await fetchDesignations();
      cancelForm();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Server error",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (designation: string) => {
    const nextDesignations = designations.filter(
      (item) => item !== designation,
    );

    try {
      setIsDeleting(true);
      await persistDesignations(nextDesignations);
      toast({ title: "Designation deleted" });
      await fetchDesignations();
      setDesignationToDelete(null);
    } catch (err: any) {
      toast({
        title: "Delete failed",
        description: err.response?.data?.message || "Server error",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DashboardLayout
      title="Designations"
      subtitle="Manage faculty designations for your college"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Designation Management</h1>
            <p className="text-muted-foreground">
              {collegeName
                ? `Manage faculty designations for ${collegeName}`
                : "Manage faculty designations for your college"}
            </p>
          </div>
          {!isAddingDesignation && (
            <Button onClick={startAddDesignation}>
              <Plus className="mr-2 h-4 w-4" /> Add Designation
            </Button>
          )}
        </div>

        {isAddingDesignation && (
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle>
                {editingDesignation ? "Edit Designation" : "Add Designation"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>College</Label>
                  <Input value={collegeName} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Designation Name *</Label>
                  <Input
                    placeholder="Enter designation"
                    value={formDesignationName}
                    onChange={(e) => setFormDesignationName(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={cancelForm}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  {isSaving ? "Saving..." : "Save Designation"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6 flex gap-4">
              <Briefcase className="h-5 w-5" />
              <div>
                <p>Total Designations</p>
                <p className="text-2xl font-bold">{designations.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex gap-4">
              <Briefcase className="h-5 w-5" />
              <div>
                <p>Visible Results</p>
                <p className="text-2xl font-bold">
                  {filteredDesignations.length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Input
          placeholder="Search designation..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <Card>
          <CardHeader>
            <CardTitle>Designations</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Designation</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDesignations.map((designation) => (
                    <TableRow key={designation}>
                      <TableCell>{designation}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEdit(designation)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => setDesignationToDelete(designation)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredDesignations.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={2}
                        className="text-center text-muted-foreground py-8"
                      >
                        No designation data available.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <DeleteConfirmationDialog
          open={!!designationToDelete}
          onOpenChange={(open) => {
            if (!open && !isDeleting) setDesignationToDelete(null);
          }}
          title="Delete designation?"
          description={`This will permanently delete ${designationToDelete || "this designation"}.`}
          confirmText="Delete"
          isLoading={isDeleting}
          onConfirm={() => {
            if (designationToDelete) handleDelete(designationToDelete);
          }}
        />
      </div>
    </DashboardLayout>
  );
}
