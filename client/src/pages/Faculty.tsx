import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Plus, Pencil, Trash2, GraduationCap, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { api } from '@/api/api';

interface FacultyMember {
  id: string;
  name: string;
  email: string;
  role: 'faculty';
  department: string;
  college: string;
  designation: string;
  experience: number;
  hasPhD: boolean;
  status: 'active' | 'inactive';
  joinDate?: string;
}


const DEPARTMENTS = [
  'Computer Science',
  'Electronics',
  'Mechanical',
  'Civil',
  'Electrical',
  'Information Technology',
];

const DESIGNATIONS = [
  'Assistant Professor',
  'Associate Professor',
  'Professor',
  'Lecturer',
];

export default function Faculty() {
  const [faculty, setFaculty] = useState<FacultyMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<FacultyMember | null>(null);
  const [formData, setFormData] = useState({
  name: '',
  email: '',
  college: '',
  department: '',
  designation: '',
  experience: '',
  hasPhD: false,
  status: 'active' as 'active' | 'inactive',
  password: '',
});

  const [loading, setLoading] = useState(false);

  // ---------------- Fetch All Faculty ----------------
  const fetchFaculty = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/hod/all-faculty');
      const facultyData: FacultyMember[] = Array.isArray(res.data.data)
  ? res.data.data.map((f: any) => ({
      id: f.id,
      name: f.name,
      email: f.email,
      role: 'faculty',
      department: f.department,
      college: f.college, 
      designation: f.designation,
      experience: f.experience,
      hasPhD: f.hasPhd,
      status: f.isActive ? 'active' : 'inactive',
      joinDate: f.createdAt,
    }))
  : [];

      setFaculty(facultyData);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || err.message,
        variant: 'destructive',
      });
      setFaculty([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  // ---------------- Reset Form ----------------
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      college:'',
      department: '',
      designation: '',
      experience: '',
      hasPhD: false,
      status: 'active',
    });
    setEditingFaculty(null);
  };

  // ---------------- Open Add Dialog ----------------
  const openAddDialog = () => {
    resetForm();
    setEditingFaculty(null);
    setIsDialogOpen(true);
  };

  // ---------------- Open Edit Dialog ----------------
  const openEditDialog = (member: FacultyMember) => {
    setEditingFaculty(member);
    setFormData({
  name: member.name,
  email: member.email,
  college: member.college, 
  password: '',
  department: member.department,
  designation: member.designation,
  experience: member.experience.toString(),
  hasPhD: member.hasPhD,
  status: member.status,
});

    setIsDialogOpen(true);
  };

  // ---------------- Add Faculty ----------------
  const handleAddFaculty = async () => {
    if (!formData.name || !formData.email || !formData.department || !formData.designation || !formData.password) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const res = await api.post('/api/hod/add-faculty', {
  name: formData.name,
  email: formData.email,
  password: formData.password,
  college: formData.college,
  department: formData.department,
  designation: formData.designation,
  experience: parseInt(formData.experience) || 0,
  isActive: formData.status === 'active',
  hasPhd: formData.hasPhD,
});


      if (res.data.success) {
        toast({
          title: 'Faculty Added',
          description: `${formData.name} has been added successfully.`,
        });
        fetchFaculty();
        setIsDialogOpen(false);
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || err.message,
        variant: 'destructive',
      });
    }
  };

  // ---------------- Edit Faculty ----------------
  const handleEditFaculty = async () => {
    if (!editingFaculty) return;

    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        department: formData.department,
        designation: formData.designation,
        experience: parseInt(formData.experience) || 0,
        isActive: formData.status === 'active',
        hasPhd: formData.hasPhD,
      };

      // Only update password if user entered it
      if (formData.password) {
        payload.password = formData.password;
      }

      const res = await api.put(`/api/hod/update-faculty/${editingFaculty.id}`, payload);

      if (res.data.success) {
        toast({
          title: 'Faculty Updated',
          description: `${formData.name} has been updated successfully.`,
        });
        fetchFaculty();
        setIsDialogOpen(false);
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || err.message,
        variant: 'destructive',
      });
    }
  };

  // ---------------- Delete Faculty ----------------
  const handleDeleteFaculty = async (id: string) => {
    const memberToDelete = faculty.find((f) => f.id === id);
    if (!memberToDelete) return;

    try {
      await api.delete(`/api/hod/delete-faculty/${id}`);
      setFaculty((prev) => prev.filter((f) => f.id !== id));
      toast({
        title: 'Faculty Removed',
        description: `${memberToDelete.name} has been removed.`,
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || err.message,
        variant: 'destructive',
      });
    }
  };

  // ---------------- Filter & Search ----------------
  const filteredFaculty = faculty.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = filterDepartment === 'all' || member.department === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  const stats = {
    total: faculty.length,
    active: faculty.filter((f) => f.status === 'active').length,
    withPhD: faculty.filter((f) => f.hasPhD).length,
  };

  // ---------------- Render ----------------
  return (
    <DashboardLayout title='Faculty' subtitle='add-faculty'>
      <div className="space-y-6">
        {/* Header & Add Button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Faculty Management
            </h1>
            <p className="text-muted-foreground">Manage faculty members and their profiles</p>
          </div>
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" /> Add Faculty
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Faculty</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                <Users className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Faculty</p>
                <p className="text-2xl font-bold text-foreground">{stats.active}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-info/10">
                <GraduationCap className="h-6 w-6 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">With PhD</p>
                <p className="text-2xl font-bold text-foreground">{stats.withPhD}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Table */}
        <Card>
          <CardHeader>
            <CardTitle>Faculty List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Faculty Member</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Loading faculty...
                      </TableCell>
                    </TableRow>
                  ) : filteredFaculty.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No faculty members found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredFaculty.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                {member.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-foreground">{member.name}</p>
                              <p className="text-sm text-muted-foreground">{member.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{member.department}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-foreground">{member.designation}</span>
                            {member.hasPhD && (
                              <Badge variant="secondary" className="text-xs">
                                PhD
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{member.experience} years</TableCell>
                        <TableCell>
                          <Badge
                            variant={member.status === 'active' ? 'default' : 'secondary'}
                            className={
                              member.status === 'active'
                                ? 'bg-success/10 text-success hover:bg-success/20'
                                : 'bg-muted text-muted-foreground'
                            }
                          >
                            {member.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right flex gap-2 justify-end">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(member)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteFaculty(member.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>


        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="w-[60%] h-[90%] overflow-scroll ">
            <DialogHeader>
              <DialogTitle>{editingFaculty ? 'Edit Faculty' : 'Add New Faculty'}</DialogTitle>
              <DialogDescription>
                {editingFaculty
                  ? 'Edit the details for the faculty member.'
                  : 'Enter the details for the new faculty member.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Dr. John Smith"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john.smith@university.edu"
                />
              </div>
              <div className="space-y-2">
  <Label htmlFor="college">College *</Label>
  <Input
    id="college"
    value={formData.college}
    onChange={(e) => setFormData({ ...formData, college: e.target.value })}
    placeholder="ABC Engineering College"
  />
</div>

              <div className="space-y-2">
                <Label htmlFor="password">{editingFaculty ? 'Password (leave blank to keep)' : 'Password *'}</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingFaculty ? 'Leave blank to keep current password' : 'Enter a password'}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Department *</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => setFormData({ ...formData, department: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Designation *</Label>
                  <Select
                    value={formData.designation}
                    onValueChange={(value) => setFormData({ ...formData, designation: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {DESIGNATIONS.map((desig) => (
                        <SelectItem key={desig} value={desig}>
                          {desig}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="experience">Experience (Years)</Label>
                  <Input
                    id="experience"
                    type="number"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'active' | 'inactive') => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hasPhD"
                  checked={formData.hasPhD}
                  onChange={(e) => setFormData({ ...formData, hasPhD: e.target.checked })}
                  className="h-4 w-4 rounded border-border"
                />
                <Label htmlFor="hasPhD" className="font-normal">
                  Has PhD/Doctorate
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={editingFaculty ? handleEditFaculty : handleAddFaculty}>
                {editingFaculty ? 'Update Faculty' : 'Add Faculty'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
