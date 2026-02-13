import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, Users, GraduationCap } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { api } from '@/api/api'; // your axios instance with auth headers

interface Dean {
  id: string;
  name: string;
  email: string;
  department: string;
  college: string;
  hasPhd: boolean;
}

export default function AddDean() {
  const [deans, setDeans] = useState<Dean[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { isLoading } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
    college: '',
    hasPhd: false,
  });

  
  const fetchDeans = async () => {
    try {
      const res = await api.get('/api/dean/all-deans');
      setDeans(res.data.data);
    } catch (err) {
      toast({ title: 'Failed to load Deans', variant: 'destructive' });
    }
  };

  useEffect(() => {
  if (!isLoading) {
    fetchDeans();
  }
}, [isLoading]);

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      department: '',
      college: '',
      hasPhd: false,
    });
    setEditingId(null);
  };

  /* ================= ADD / UPDATE ================= */
  const handleSave = async () => {
    if (!formData.name || !formData.email || !formData.department || !formData.college) {
      toast({ title: 'Fill all required fields', variant: 'destructive' });
      return;
    }

    setIsSaving(true);

    try {
      if (editingId) {
        
        await api.put(`/api/dean/update/${editingId}`, {
          ...formData,
        });
        toast({ title: 'Dean updated successfully' });
      } else {
      
        await api.post('/api/dean/add-dean', {
          ...formData,
        });
        toast({ title: 'Dean added successfully' });
      }

      fetchDeans();
      resetForm();
      setIsDialogOpen(false);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Server error',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  /* ================= DELETE ================= */
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Dean?')) return;
    try {
      await api.delete(`/api/dean/delete/${id}`);
      toast({ title: 'Dean deleted' });
      fetchDeans();
    } catch {
      toast({ title: 'Delete failed', variant: 'destructive' });
    }
  };

  /* ================= OPEN EDIT ================= */
  const openEdit = (dean: Dean) => {
    setFormData({
      name: dean.name,
      email: dean.email,
      password: '',
      department: dean.department,
      college: dean.college,
      hasPhd: dean.hasPhd,
    });
    setEditingId(dean.id);
    setIsDialogOpen(true);
  };

  const filteredDeans = deans.filter(
    (h) =>
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.college.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: deans.length,
    withPhD: deans.filter((h) => h.hasPhd).length,
  };

  return (
    <DashboardLayout title="Dean Management">
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Dean Management</h1>
            <p className="text-muted-foreground">Manage Deans</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" /> Add Dean
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Dean' : 'Add Dean'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <Input
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                {!editingId && (
                  <Input
                    placeholder="Password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                )}
                <Input
                  placeholder="Department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
                <Input
                  placeholder="College"
                  value={formData.college}
                  onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                />
                <label className="flex gap-2 items-center">
                  <input
                    type="checkbox"
                    checked={formData.hasPhd}
                    onChange={(e) => setFormData({ ...formData, hasPhd: e.target.checked })}
                  />
                  Has PhD
                </label>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6 flex gap-4">
              <Users />
              {stats.total} Deans
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex gap-4">
              <GraduationCap />
              {stats.withPhD} with PhD
            </CardContent>
          </Card>
        </div>

        <Input
          placeholder="Search Deans..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* TABLE */}
        <Card>
          <CardHeader>
            <CardTitle>Dean List</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>College</TableHead>
                  <TableHead>PhD</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeans.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell>{h.name}</TableCell>
                    <TableCell>{h.email}</TableCell>
                    <TableCell>{h.department}</TableCell>
                    <TableCell>{h.college}</TableCell>
                    <TableCell>{h.hasPhd ? <Badge>PhD</Badge> : '—'}</TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(h)}>
                        <Pencil />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => handleDelete(h.id)}
                      >
                        <Trash2 />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
