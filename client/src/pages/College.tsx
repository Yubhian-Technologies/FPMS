import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Plus, Pencil, Trash2, Building2, GraduationCap } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

/* ✅ FIXED INTERFACE (MATCHES YOUR DATA) */
interface College {
  id: string;
  name: string;
  administrator: string;
  establishedYear: number;
}

/* Mock Data */
const INITIAL_COLLEGES: College[] = [
  {
    id: '1',
    name: 'ABC Engineering College',
    administrator: 'Dr. John Smith',
    establishedYear: 1998,
  },
  {
    id: '2',
    name: 'XYZ Institute of Technology',
    administrator: 'Dr. Sarah Johnson',
    establishedYear: 2002,
  },
];

export default function College() {
  const [colleges, setColleges] = useState<College[]>(() => {
    const stored = localStorage.getItem('fpms_colleges');
    return stored ? JSON.parse(stored) : INITIAL_COLLEGES;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCollege, setEditingCollege] = useState<College | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    administrator: '',
    establishedYear: '',
  });

  const saveColleges = (updated: College[]) => {
    setColleges(updated);
    localStorage.setItem('fpms_colleges', JSON.stringify(updated));
  };

  const resetForm = () => {
    setFormData({ name: '', administrator: '', establishedYear: '' });
    setEditingCollege(null);
  };

  /* ADD */
  const handleAddCollege = () => {
    if (!formData.name || !formData.administrator) {
      toast({
        title: 'Validation Error',
        description: 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    const newCollege: College = {
      id: crypto.randomUUID(),
      name: formData.name,
      administrator: formData.administrator,
      establishedYear: Number(formData.establishedYear) || new Date().getFullYear(),
    };

    saveColleges([...colleges, newCollege]);
    toast({ title: 'College Added', description: `${formData.name} created` });
    resetForm();
    setIsAddDialogOpen(false);
  };

  /* EDIT */
  const handleEditCollege = () => {
    if (!editingCollege) return;

    const updated = colleges.map((c) =>
      c.id === editingCollege.id
        ? {
            ...c,
            name: formData.name,
            administrator: formData.administrator,
            establishedYear: Number(formData.establishedYear),
          }
        : c
    );

    saveColleges(updated);
    toast({ title: 'College Updated' });
    resetForm();
  };

  /* DELETE */
  const handleDeleteCollege = (id: string) => {
    const col = colleges.find((c) => c.id === id);
    saveColleges(colleges.filter((c) => c.id !== id));
    toast({ title: 'College Removed', description: col?.name });
  };

  const openEditDialog = (college: College) => {
    setEditingCollege(college);
    setFormData({
      name: college.name,
      administrator: college.administrator,
      establishedYear: college.establishedYear.toString(),
    });
  };

  const filteredColleges = colleges.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.administrator.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout title="Colleges" subtitle="Manage colleges">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Colleges</h1>
            <p className="text-muted-foreground">Add and manage colleges</p>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" /> Add College
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add College</DialogTitle>
                <DialogDescription>Create a new college</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <Label>College Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Administrator *</Label>
                  <Input
                    value={formData.administrator}
                    onChange={(e) =>
                      setFormData({ ...formData, administrator: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label>Established Year</Label>
                  <Input
                    type="number"
                    value={formData.establishedYear}
                    onChange={(e) =>
                      setFormData({ ...formData, establishedYear: e.target.value })
                    }
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddCollege}>Add</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="flex gap-4 p-6">
              <Building2 />
              <div>
                <p>Total Colleges</p>
                <p className="text-2xl font-bold">{colleges.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex gap-4 p-6">
              <GraduationCap />
              <div>
                <p>Administrators</p>
                <p className="text-2xl font-bold">{colleges.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Colleges List</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search college or administrator..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-4"
            />

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>College</TableHead>
                  <TableHead>Administrator</TableHead>
                  <TableHead>Established</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredColleges.map((college) => (
                  <TableRow key={college.id}>
                    <TableCell>{college.name}</TableCell>
                    <TableCell>{college.administrator}</TableCell>
                    <TableCell>{college.establishedYear}</TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => openEditDialog(college)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => handleDeleteCollege(college.id)}
                      >
                        <Trash2 className="h-4 w-4" />
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
