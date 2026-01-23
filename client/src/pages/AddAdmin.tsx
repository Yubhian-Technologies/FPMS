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
import { api } from '@/api/api';

interface Administrator {
  id: string;
  name: string;
  email: string;
  experience: number;
  hasPhD: boolean;
  college: string;
}

export default function AdministratorManagement() {
  const [admins, setAdmins] = useState<Administrator[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    experience: '',
    hasPhD: false,
    college: '',
  });

 
  const fetchAdmins = async () => {
  try {
    const res = await api.get('/api/committee/admins');

    const normalizedAdmins = res.data.data.map((a: any) => ({
      ...a,
      hasPhD: a.hasPhd, 
    }));

    setAdmins(normalizedAdmins);
  } catch (err) {
    toast({ title: 'Failed to load admins', variant: 'destructive' });
  }
};


  useEffect(() => {
    fetchAdmins();
  }, []);

  /* ================= RESET FORM ================= */
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      experience: '',
      hasPhD: false,
      college: '',
    });
    setEditingId(null);
  };

  /* ================= ADD / UPDATE ================= */
  const handleSave = async () => {
    if (!formData.name || !formData.email || !formData.college) {
      toast({ title: 'Fill all required fields', variant: 'destructive' });
      return;
    }

    setIsSaving(true);

    try {
      if (editingId) {
        // UPDATE
        await api.put(`/api/committee/update/${editingId}`, {
          ...formData,
          experience: Number(formData.experience),
          hasPhd: formData.hasPhD,
        });

        toast({ title: 'Admin updated successfully' });
      } else {
        // ADD
        await api.post('/api/committee/admin-add', {
          ...formData,
          experience: Number(formData.experience),
          hasPhd: formData.hasPhD,
        });

        toast({ title: 'Admin added successfully' });
      }

      await fetchAdmins();
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
    if (!confirm('Are you sure you want to delete this admin?')) return;

    try {
      await api.delete(`/api/committee/delete/${id}`);
      toast({ title: 'Admin deleted' });
      fetchAdmins();
    } catch {
      toast({ title: 'Delete failed', variant: 'destructive' });
    }
  };

  /* ================= OPEN EDIT ================= */
  const openEdit = (admin: Administrator) => {
    setFormData({
      name: admin.name,
      email: admin.email,
      password: '',
      experience: admin.experience.toString(),
      hasPhD: admin.hasPhD,
      college: admin.college,
    });
    setEditingId(admin.id);
    setIsDialogOpen(true);
  };

  const filteredAdmins = admins.filter(
    a =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.college.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: admins.length,
    withPhD: admins.filter(a => a.hasPhD).length,
  };

  return (
    <DashboardLayout title="Administrator" subtitle="">
      <div className="space-y-6">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Administrator Management</h1>
            <p className="text-muted-foreground">Manage college administrators</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" /> Add Administrator
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingId ? 'Edit Administrator' : 'Add Administrator'}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <Input placeholder="Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                <Input placeholder="Email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                <Input placeholder="Password" type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                <Input placeholder="College" value={formData.college} onChange={e => setFormData({ ...formData, college: e.target.value })} />
                <Input type="number" placeholder="Experience" value={formData.experience} onChange={e => setFormData({ ...formData, experience: e.target.value })} />

                <label className="flex gap-2 items-center">
                  <input type="checkbox" checked={formData.hasPhD} onChange={e => setFormData({ ...formData, hasPhD: e.target.checked })} />
                  Has PhD
                </label>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 gap-4">
          <Card><CardContent className="p-6 flex gap-4"><Users />{stats.total}</CardContent></Card>
          <Card><CardContent className="p-6 flex gap-4"><GraduationCap />{stats.withPhD}</CardContent></Card>
        </div>

        <Input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />

        {/* TABLE */}
        <Card>
          <CardHeader><CardTitle>Administrators</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>College</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>PhD</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredAdmins.map(a => (
                  <TableRow key={a.id}>
                    <TableCell>{a.name}</TableCell>
                    <TableCell>{a.college}</TableCell>
                    <TableCell>{a.experience} yrs</TableCell>
                    <TableCell>{a.hasPhD ? <Badge>PhD</Badge> : '—'}</TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(a)}><Pencil /></Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(a.id)}><Trash2 /></Button>
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
