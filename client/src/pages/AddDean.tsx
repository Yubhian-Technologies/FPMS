import { useEffect, useState } from "react";
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

interface Dean {
  id: string;
  name: string;
  email: string;
  college: string;
  role: string;
  level?: number;
  hasPhd?: boolean;
}

interface CollegeDetails {
  id?: string;
  name: string;
  code?: string;
}

interface RoleOption {
  id: string;
  name: string;
  level: number;
}

export default function AddDean() {
  const [deans, setDeans] = useState<Dean[]>([]);
  const [collegeDetails, setCollegeDetails] = useState<CollegeDetails | null>(
    null,
  );
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingDean, setIsAddingDean] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deanToDelete, setDeanToDelete] = useState<Dean | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    pass: "",
    confirm_pass: "",
    college: "",
    role: "",
    level: 0,
    hasPhd: false,
  });

  const lockedCollegeName = collegeDetails?.name || "";

  const normalizedLockedCollege = String(lockedCollegeName || "")
    .trim()
    .toLowerCase();

  const occupiedRoleNamesForCollege = new Set(
    deans
      .filter((dean) => {
        const deanCollege = String(dean.college || "")
          .trim()
          .toLowerCase();
        return normalizedLockedCollege
          ? deanCollege === normalizedLockedCollege
          : true;
      })
      .map((dean) =>
        String(dean.role || "")
          .trim()
          .toLowerCase(),
      )
      .filter(Boolean),
  );

  const availableRoleOptions = roleOptions.filter((role) => {
    const normalizedRoleName = String(role.name || "")
      .trim()
      .toLowerCase();

    if (!normalizedRoleName) return false;

    if (editingId) {
      const currentRole = String(formData.role || "")
        .trim()
        .toLowerCase();
      return (
        !occupiedRoleNamesForCollege.has(normalizedRoleName) ||
        normalizedRoleName === currentRole
      );
    }

    return !occupiedRoleNamesForCollege.has(normalizedRoleName);
  });

  const fetchDeans = async () => {
    try {
      const res = await api.get("/api/dean/all-deans");
      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      const normalized = data
        .map((item: any) => ({
          ...item,
          level:
            item.level !== undefined && Number.isFinite(Number(item.level))
              ? Number(item.level)
              : undefined,
          hasPhd: item.hasPhd ?? item.hasPhD ?? false,
        }))
        .filter((item: any) =>
          String(item.role || "")
            .trim()
            .toLowerCase()
            .startsWith("dean"),
        );
      setDeans(normalized);
    } catch {
      toast({ title: "Failed to load deans", variant: "destructive" });
    }
  };

  const fetchCollegeDetails = async () => {
    try {
      const res = await api.get("/api/dean/college-details");
      const data = res.data?.data || null;
      setCollegeDetails(data);
    } catch {
      toast({
        title: "Failed to load college details",
        variant: "destructive",
      });
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await api.get("/api/dean/roles");
      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      setRoleOptions(data);
    } catch {
      toast({ title: "Failed to load roles", variant: "destructive" });
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        await Promise.all([fetchDeans(), fetchCollegeDetails(), fetchRoles()]);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const resetForm = () => {
    const defaultRole = availableRoleOptions[0];
    setFormData({
      name: "",
      email: "",
      pass: "",
      confirm_pass: "",
      college: lockedCollegeName,
      role: defaultRole?.name || "",
      level: Number(defaultRole?.level ?? 0),
      hasPhd: false,
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
    setEditingId(null);
  };

  const startNewDean = () => {
    resetForm();
    setIsAddingDean(true);
  };

  const cancelForm = () => {
    setIsAddingDean(false);
    resetForm();
  };

  const openEdit = (dean: Dean) => {
    const matchingRole = roleOptions.find((item) => item.name === dean.role);
    setFormData({
      name: dean.name,
      email: dean.email,
      pass: "",
      confirm_pass: "",
      college: lockedCollegeName || dean.college,
      role: dean.role || availableRoleOptions[0]?.name || "",
      level: Number(dean.level ?? matchingRole?.level ?? 0),
      hasPhd: !!dean.hasPhd,
    });
    setEditingId(dean.id);
    setIsAddingDean(true);
  };

  const handleSave = async () => {
    const resolvedCollege = lockedCollegeName || formData.college;

    if (
      !formData.name ||
      !formData.email ||
      !resolvedCollege ||
      !formData.role ||
      !Number.isFinite(formData.level)
    ) {
      toast({ title: "Fill all required fields", variant: "destructive" });
      return;
    }

    const selectedRoleName = String(formData.role || "")
      .trim()
      .toLowerCase();
    const isSelectedRoleAvailable = availableRoleOptions.some(
      (role) =>
        String(role.name || "")
          .trim()
          .toLowerCase() === selectedRoleName,
    );

    if (!isSelectedRoleAvailable) {
      toast({
        title: "Role not available",
        description: "Selected role is already assigned in this college.",
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
        role: formData.role,
        level: Number(formData.level),
        hasPhd: formData.hasPhd,
      };

      if (editingId) {
        await api.put(`/api/dean/update/${editingId}`, payload);
        toast({ title: "Dean updated successfully" });
      } else {
        await api.post("/api/dean/add-dean", payload);
        toast({ title: "Dean added successfully" });
      }

      await fetchDeans();
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
      await api.delete(`/api/dean/delete/${id}`);
      toast({ title: "Dean deleted" });
      await fetchDeans();
      setDeanToDelete(null);
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const collegeDeans = deans.filter((dean) => {
    if (!normalizedLockedCollege) return true;
    return (
      String(dean.college || "")
        .trim()
        .toLowerCase() === normalizedLockedCollege
    );
  });

  const filteredDeans = collegeDeans.filter((dean) => {
    const q = searchQuery.toLowerCase();
    return (
      dean.name.toLowerCase().includes(q) ||
      dean.email.toLowerCase().includes(q) ||
      dean.college.toLowerCase().includes(q) ||
      dean.role.toLowerCase().includes(q)
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
    if (!isAddingDean) return;

    const selectedRoleName = String(formData.role || "")
      .trim()
      .toLowerCase();
    const hasSelectedRole = availableRoleOptions.some(
      (role) =>
        String(role.name || "")
          .trim()
          .toLowerCase() === selectedRoleName,
    );

    if (hasSelectedRole) return;

    const fallbackRole = availableRoleOptions[0];
    setFormData((prev) => ({
      ...prev,
      role: fallbackRole?.name || "",
      level: Number(fallbackRole?.level ?? 0),
    }));
  }, [availableRoleOptions, formData.role, isAddingDean]);

  return (
    <DashboardLayout
      title="Add Dean"
      subtitle="Manage deans by college and role"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dean Management</h1>
            <p className="text-muted-foreground">Add and manage deans</p>
          </div>
          {!isAddingDean && (
            <Button onClick={startNewDean}>
              <Plus className="mr-2 h-4 w-4" /> Add Dean
            </Button>
          )}
        </div>

        {isAddingDean && (
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle>{editingId ? "Edit Dean" : "Add Dean"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input
                    placeholder="Enter dean name"
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
                    placeholder="dean@example.com"
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
                  <Label>Role *</Label>
                  <Select
                    value={formData.role}
                    disabled={!availableRoleOptions.length}
                    onValueChange={(value) => {
                      const selectedRole = availableRoleOptions.find(
                        (item) => item.name === value,
                      );
                      setFormData({
                        ...formData,
                        role: value,
                        level: Number(selectedRole?.level ?? 0),
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          availableRoleOptions.length
                            ? "Select role"
                            : "No dean roles available for this college"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoleOptions.map((role) => (
                        <SelectItem key={role.id} value={role.name}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    <span className="text-sm">Dean has completed PhD</span>
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
                  {isSaving ? "Saving..." : "Save Dean"}
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
                <p>Total Deans</p>
                <p className="text-2xl font-bold">{collegeDeans.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex gap-4">
              <Users className="h-5 w-5" />
              <div>
                <p>Visible Results</p>
                <p className="text-2xl font-bold">{filteredDeans.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Input
          placeholder="Search by name, email, college or role..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <Card>
          <CardHeader>
            <CardTitle>Deans</CardTitle>
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
                    <TableHead>College</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>PhD</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeans.map((dean) => (
                    <TableRow key={dean.id}>
                      <TableCell>{dean.name}</TableCell>
                      <TableCell>{dean.email}</TableCell>
                      <TableCell>{dean.college}</TableCell>
                      <TableCell>{dean.role}</TableCell>
                      <TableCell>{dean.level ?? "-"}</TableCell>
                      <TableCell>{dean.hasPhd ? "Yes" : "No"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEdit(dean)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => setDeanToDelete(dean)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredDeans.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-muted-foreground py-8"
                      >
                        No dean data available.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <DeleteConfirmationDialog
          open={!!deanToDelete}
          onOpenChange={(open) => {
            if (!open && !isDeleting) setDeanToDelete(null);
          }}
          title="Delete dean?"
          description={`This will permanently delete ${deanToDelete?.name || "this dean"}.`}
          confirmText="Delete"
          isLoading={isDeleting}
          onConfirm={() => {
            if (deanToDelete) handleDelete(deanToDelete.id);
          }}
        />
      </div>
    </DashboardLayout>
  );
}
