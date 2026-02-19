import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { api } from "@/api/api";
import DeleteConfirmationDialog from "@/components/DeleteConfirmationDialog";

interface Hod {
  id: string;
  name: string;
  email: string;
  department: string;
  college: string;
  role?: string;
  level?: number;
  hasPhd?: boolean;
}

interface CollegeDetails {
  id?: string;
  name: string;
  code?: string;
  branches?: string[];
}

export default function AddHod() {
  const [hods, setHods] = useState<Hod[]>([]);
  const [collegeDetails, setCollegeDetails] = useState<CollegeDetails | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingHod, setIsAddingHod] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hodToDelete, setHodToDelete] = useState<Hod | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [hodRoleLevel, setHodRoleLevel] = useState(0);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    pass: "",
    confirm_pass: "",
    college: "",
    department: "",
    role: "hod",
    level: 0,
    hasPhd: false,
  });

  const lockedCollegeName = collegeDetails?.name || "";
  const normalizedLockedCollege = String(lockedCollegeName || "")
    .trim()
    .toLowerCase();
  const branchOptions = useMemo(
    () =>
      Array.isArray(collegeDetails?.branches)
        ? collegeDetails!
            .branches!.map((item) => String(item || "").trim())
            .filter(Boolean)
        : [],
    [collegeDetails],
  );

  const occupiedDepartmentsForCollege = new Set(
    hods
      .filter((hod) => {
        const hodCollege = String(hod.college || "")
          .trim()
          .toLowerCase();
        return normalizedLockedCollege
          ? hodCollege === normalizedLockedCollege
          : true;
      })
      .map((hod) =>
        String(hod.department || "")
          .trim()
          .toLowerCase(),
      )
      .filter(Boolean),
  );

  const availableBranchOptions = branchOptions.filter((branch) => {
    const normalizedBranch = String(branch || "")
      .trim()
      .toLowerCase();
    if (!normalizedBranch) return false;

    if (editingId) {
      const currentDepartment = String(formData.department || "")
        .trim()
        .toLowerCase();
      return (
        !occupiedDepartmentsForCollege.has(normalizedBranch) ||
        normalizedBranch === currentDepartment
      );
    }

    return !occupiedDepartmentsForCollege.has(normalizedBranch);
  });

  const fetchHods = async () => {
    try {
      const res = await api.get("/api/admin/all-hods");
      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      const normalized = data.map((item: any) => ({
        ...item,
        level:
          item.level !== undefined && Number.isFinite(Number(item.level))
            ? Number(item.level)
            : undefined,
        hasPhd: item.hasPhd ?? item.hasPhD ?? false,
      }));
      setHods(normalized);
    } catch {
      toast({ title: "Failed to load HODs", variant: "destructive" });
    }
  };

  const fetchCollegeDetails = async () => {
    try {
      const res = await api.get("/api/admin/college-details");
      const data = res.data?.data || null;
      setCollegeDetails(data);
    } catch {
      toast({
        title: "Failed to load college details",
        variant: "destructive",
      });
    }
  };

  const fetchHodRoleOption = async () => {
    try {
      const res = await api.get("/api/admin/hod-role");
      const data = res.data?.data || {};
      const resolvedLevel = Number(data.level);
      const nextLevel = Number.isFinite(resolvedLevel) ? resolvedLevel : 0;
      setHodRoleLevel(nextLevel);
    } catch {
      setHodRoleLevel(0);
      toast({ title: "Failed to load HOD role", variant: "destructive" });
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        await Promise.all([
          fetchHods(),
          fetchCollegeDetails(),
          fetchHodRoleOption(),
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      pass: "",
      confirm_pass: "",
      college: lockedCollegeName,
      department: availableBranchOptions[0] || "",
      role: "hod",
      level: hodRoleLevel,
      hasPhd: false,
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
    setEditingId(null);
  };

  const startNewHod = () => {
    resetForm();
    setIsAddingHod(true);
  };

  const cancelForm = () => {
    setIsAddingHod(false);
    resetForm();
  };

  const openEdit = (hod: Hod) => {
    setFormData({
      name: hod.name,
      email: hod.email,
      pass: "",
      confirm_pass: "",
      college: lockedCollegeName || hod.college,
      department: hod.department || "",
      role: "hod",
      level:
        hod.level !== undefined && Number.isFinite(Number(hod.level))
          ? Number(hod.level)
          : hodRoleLevel,
      hasPhd: !!hod.hasPhd,
    });
    setEditingId(hod.id);
    setIsAddingHod(true);
  };

  const handleSave = async () => {
    const resolvedCollege = lockedCollegeName || formData.college;

    if (
      !formData.name ||
      !formData.email ||
      !resolvedCollege ||
      !formData.department ||
      !Number.isFinite(formData.level)
    ) {
      toast({ title: "Fill all required fields", variant: "destructive" });
      return;
    }

    const selectedDepartment = String(formData.department || "")
      .trim()
      .toLowerCase();
    const isSelectedDepartmentAvailable = availableBranchOptions.some(
      (branch) =>
        String(branch || "")
          .trim()
          .toLowerCase() === selectedDepartment,
    );

    if (!isSelectedDepartmentAvailable) {
      toast({
        title: "Branch not available",
        description: "Selected branch already has an HOD.",
        variant: "destructive",
      });
      return;
    }

    if (!editingId && !formData.pass) {
      toast({ title: "Password is required", variant: "destructive" });
      return;
    }

    if (formData.pass) {
      if (formData.pass.length < 6) {
        toast({
          title: "Password must be at least 6 characters",
          variant: "destructive",
        });
        return;
      }

      if (formData.pass !== formData.confirm_pass) {
        toast({
          title: "Password mismatch",
          description: "Password doesn't match",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSaving(true);

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        pass: formData.pass || undefined,
        confirm_pass: formData.confirm_pass || undefined,
        college: resolvedCollege,
        department: formData.department,
        role: "hod",
        level: Number(formData.level),
        hasPhd: formData.hasPhd,
      };

      if (editingId) {
        await api.put(`/api/admin/update/${editingId}`, payload);
        toast({ title: "HOD updated successfully" });
      } else {
        await api.post("/api/admin/add-hod", payload);
        toast({ title: "HOD added successfully" });
      }

      await fetchHods();
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

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(true);
      await api.delete(`/api/admin/delete/${id}`);
      toast({ title: "HOD deleted" });
      await fetchHods();
      setHodToDelete(null);
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const collegeHods = hods.filter((hod) => {
    if (!normalizedLockedCollege) return true;
    return (
      String(hod.college || "")
        .trim()
        .toLowerCase() === normalizedLockedCollege
    );
  });

  const filteredHods = collegeHods.filter((hod) => {
    const q = searchQuery.toLowerCase();
    return (
      hod.name.toLowerCase().includes(q) ||
      hod.email.toLowerCase().includes(q) ||
      hod.department.toLowerCase().includes(q) ||
      hod.college.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    if (!lockedCollegeName) return;

    setFormData((prev) => {
      if (prev.college === lockedCollegeName) return prev;
      return {
        ...prev,
        college: lockedCollegeName,
      };
    });
  }, [lockedCollegeName]);

  useEffect(() => {
    setFormData((prev) => {
      if (Number(prev.level) === Number(hodRoleLevel)) return prev;
      return {
        ...prev,
        level: Number(hodRoleLevel),
      };
    });
  }, [hodRoleLevel]);

  useEffect(() => {
    if (!isAddingHod) return;

    const selectedDepartment = String(formData.department || "")
      .trim()
      .toLowerCase();
    const hasSelectedDepartment = availableBranchOptions.some(
      (branch) =>
        String(branch || "")
          .trim()
          .toLowerCase() === selectedDepartment,
    );

    if (hasSelectedDepartment) return;

    setFormData((prev) => ({
      ...prev,
      department: availableBranchOptions[0] || "",
    }));
  }, [availableBranchOptions, formData.department, isAddingHod]);

  return (
    <DashboardLayout title="Add HOD" subtitle="Manage HODs by department">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">HOD Management</h1>
            <p className="text-muted-foreground">Add and manage HODs</p>
          </div>
          {!isAddingHod && (
            <Button onClick={startNewHod}>
              <Plus className="mr-2 h-4 w-4" /> Add HOD
            </Button>
          )}
        </div>

        {isAddingHod && (
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle>{editingId ? "Edit HOD" : "Add HOD"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input
                    placeholder="Enter HOD name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email Address *</Label>
                  <Input
                    type="email"
                    placeholder="hod@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>College *</Label>
                  <Input
                    value={
                      lockedCollegeName
                        ? `${lockedCollegeName}${collegeDetails?.code ? ` (${collegeDetails.code})` : ""}`
                        : ""
                    }
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dept / Branch *</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) =>
                      setFormData({ ...formData, department: value })
                    }
                    disabled={!availableBranchOptions.length}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          availableBranchOptions.length
                            ? "Select branch"
                            : "No branches available for this college"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {availableBranchOptions.map((branch) => (
                        <SelectItem key={branch} value={branch}>
                          {branch}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Role *</Label>
                  <Input value="hod" disabled />
                </div>
                <div className="space-y-2">
                  <Label>Level *</Label>
                  <Input value={String(formData.level)} disabled />
                </div>
                <div className="space-y-2">
                  <Label>
                    {editingId ? "New Password" : "Password"}{" "}
                    {!editingId && "*"}
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder={
                        editingId ? "Enter new password" : "Enter password"
                      }
                      value={formData.pass}
                      onChange={(e) =>
                        setFormData({ ...formData, pass: e.target.value })
                      }
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Confirm Password {!editingId && "*"}</Label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter password"
                      value={formData.confirm_pass}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confirm_pass: e.target.value,
                        })
                      }
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {formData.confirm_pass &&
                    formData.pass !== formData.confirm_pass && (
                      <p className="text-xs text-red-600">
                        Password doesn't match
                      </p>
                    )}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Has PhD</Label>
                  <label className="flex items-center gap-2 rounded-md border px-3 py-2">
                    <input
                      type="checkbox"
                      checked={formData.hasPhd}
                      onChange={(e) =>
                        setFormData({ ...formData, hasPhd: e.target.checked })
                      }
                      className="h-4 w-4"
                    />
                    <span className="text-sm">HOD has completed PhD</span>
                  </label>
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
                  {isSaving ? "Saving..." : "Save HOD"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6 flex gap-4">
              <Users className="h-5 w-5" />
              <div>
                <p>Total HODs</p>
                <p className="text-2xl font-bold">{collegeHods.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex gap-4">
              <Users className="h-5 w-5" />
              <div>
                <p>Visible Results</p>
                <p className="text-2xl font-bold">{filteredHods.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Input
          placeholder="Search by name, email, department or college..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <Card>
          <CardHeader>
            <CardTitle>HODs</CardTitle>
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
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Dept / Branch</TableHead>
                    <TableHead>College</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>PhD</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHods.map((hod) => (
                    <TableRow key={hod.id}>
                      <TableCell>{hod.name}</TableCell>
                      <TableCell>{hod.email}</TableCell>
                      <TableCell>{hod.department || "-"}</TableCell>
                      <TableCell>{hod.college}</TableCell>
                      <TableCell>{hod.role || "hod"}</TableCell>
                      <TableCell>{hod.level ?? "-"}</TableCell>
                      <TableCell>{hod.hasPhd ? "Yes" : "No"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEdit(hod)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => setHodToDelete(hod)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredHods.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center text-muted-foreground py-8"
                      >
                        No HOD data available.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <DeleteConfirmationDialog
          open={!!hodToDelete}
          onOpenChange={(open) => {
            if (!open && !isDeleting) setHodToDelete(null);
          }}
          title="Delete HOD?"
          description={`This will permanently delete ${hodToDelete?.name || "this HOD"}.`}
          confirmText="Delete"
          isLoading={isDeleting}
          onConfirm={() => {
            if (hodToDelete) handleDelete(hodToDelete.id);
          }}
        />
      </div>
    </DashboardLayout>
  );
}
