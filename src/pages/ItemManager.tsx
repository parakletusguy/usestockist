import { useState } from 'react';
import { useItems, useCreateItem, useUpdateItem, useDeleteItem, Item, CreateItemInput } from '@/hooks/useItems';
import { DEPARTMENTS } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Pencil, Trash2, Search, Building2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORIES = ['Beverages', 'Food', 'Supplies', 'Cleaning', 'Equipment', 'Other'];
const UNITS = ['pcs', 'kg', 'ltr', 'box', 'pack', 'bottle', 'can', 'roll'];

const ItemManager = () => {
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const { data: items, isLoading } = useItems(departmentFilter);
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [deletingItem, setDeletingItem] = useState<Item | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const [formData, setFormData] = useState<CreateItemInput>({
    name: '',
    category: '',
    department: 'Retail',
    departments: ['Retail'],
    unit_of_measure: '',
    low_stock_threshold: 0,
    unit_cost: 0,
  });

  const filteredItems = items?.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleOpenForm = (item?: Item) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        category: item.category,
        department: item.department || 'Retail',
        departments: item.departments?.length ? item.departments : [item.department || 'Retail'],
        unit_of_measure: item.unit_of_measure,
        low_stock_threshold: item.low_stock_threshold,
        unit_cost: item.unit_cost,
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        category: '',
        department: 'Retail',
        departments: ['Retail'],
        unit_of_measure: '',
        low_stock_threshold: 0,
        unit_cost: 0,
      });
    }
    setIsFormOpen(true);
  };

  const toggleDepartment = (dept: string) => {
    const current = formData.departments || [];
    const updated = current.includes(dept)
      ? current.filter(d => d !== dept)
      : [...current, dept];
    setFormData({
      ...formData,
      departments: updated,
      department: updated[0] || 'Retail',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.departments || formData.departments.length === 0) {
      alert('Please assign at least one department.');
      return;
    }
    if (editingItem) {
      await updateItem.mutateAsync({ id: editingItem.id, ...formData });
    } else {
      await createItem.mutateAsync(formData);
    }
    setIsFormOpen(false);
  };

  const handleDelete = async () => {
    if (deletingItem) {
      await deleteItem.mutateAsync(deletingItem.id);
      setIsDeleteOpen(false);
      setDeletingItem(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Items Manager</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Manage your master inventory catalog — items can be shared across multiple departments
          </p>
        </div>
        <Button onClick={() => handleOpenForm()} className="w-full sm:w-auto h-11 sm:h-9 text-base sm:text-xs">
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* Info Banner: Multi-Department Items */}
      <div className="flex items-start gap-3 p-3 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 text-xs sm:text-sm text-blue-800 dark:text-blue-300">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <span>
          <strong>Shared Items:</strong> Each item can be assigned to multiple departments. The same physical item (e.g. <em>Mineral Water</em>) can appear in <em>Bar</em>, <em>Kitchen (Nox)</em>, and <em>Retail</em> simultaneously — tracked separately per department in the Stock Count.
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-base sm:text-xs h-11 sm:h-9"
          />
        </div>
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-full sm:w-52 h-11 sm:h-9 text-base sm:text-xs">
            <Building2 className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent className="bg-background">
            <SelectItem value="all">All Departments</SelectItem>
            {DEPARTMENTS.map(dept => (
              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48 h-11 sm:h-9 text-base sm:text-xs">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent className="bg-background">
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Mobile Card-List Layout (shown on screens < md) */}
      <div className="space-y-3 md:hidden">
        {!filteredItems || filteredItems.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 text-sm border rounded-lg p-4">
            No items found. Add your first item to get started.
          </div>
        ) : (
          filteredItems.map(item => (
            <div key={item.id} className="rounded-lg border p-4 space-y-2 bg-card">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-base">{item.name}</h3>
                  <p className="text-xs text-muted-foreground">{item.category} · {item.unit_of_measure}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => handleOpenForm(item)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-destructive"
                    onClick={() => {
                      setDeletingItem(item);
                      setIsDeleteOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {(item.departments?.length ? item.departments : [item.department || 'Retail']).map(dept => (
                  <span
                    key={dept}
                    className="text-[11px] px-2 py-0.5 rounded font-medium bg-primary/10 text-primary border border-primary/20"
                  >
                    {dept}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs">
                <div>
                  <span className="text-muted-foreground">Low Stock Threshold: </span>
                  <span className="font-medium">{item.low_stock_threshold}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Unit Cost: </span>
                  <span className="font-medium">${(Number(item.unit_cost) || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table (hidden on mobile, shown md+) */}
      <div className="rounded-md border overflow-x-auto hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Departments</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="text-right">Low Stock Threshold</TableHead>
              <TableHead className="text-right">Unit Cost ($)</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!filteredItems || filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No items found. Add your first item to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(item.departments?.length ? item.departments : [item.department || 'Retail']).map(dept => (
                        <span
                          key={dept}
                          className="text-[11px] px-1.5 py-0.5 rounded font-medium bg-primary/10 text-primary border border-primary/20"
                        >
                          {dept}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{item.unit_of_measure}</TableCell>
                  <TableCell className="text-right">{item.low_stock_threshold}</TableCell>
                  <TableCell className="text-right">${(Number(item.unit_cost) || 0).toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenForm(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setDeletingItem(item);
                          setIsDeleteOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog — full screen on mobile, modal on desktop */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="flex flex-col w-full max-w-lg rounded-none sm:rounded-lg p-0 gap-0 h-dvh sm:h-auto sm:max-h-[90vh]">
          {/* Scrollable header + form */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 pt-4 pb-2 sm:px-6 sm:pt-6 border-b">
              <DialogHeader>
                <DialogTitle className="text-xl">{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
                <DialogDescription className="text-xs sm:text-sm">
                  {editingItem ? 'Update item details. You can assign it to multiple departments.' : 'Fill in item details and select which departments stock this item.'}
                </DialogDescription>
              </DialogHeader>
            </div>

            <form id="item-form" onSubmit={handleSubmit} className="space-y-4 px-4 py-4 sm:px-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm">Item Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter item name"
                  className="text-base sm:text-sm h-11 sm:h-9"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                    required
                  >
                    <SelectTrigger className="text-base sm:text-sm h-11 sm:h-9">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-background">
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit" className="text-sm">Unit</Label>
                  <Select
                    value={formData.unit_of_measure}
                    onValueChange={(value) => setFormData({ ...formData, unit_of_measure: value })}
                    required
                  >
                    <SelectTrigger className="text-base sm:text-sm h-11 sm:h-9">
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent className="bg-background">
                      {UNITS.map(unit => (
                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Multi-Department Assignment */}
              <div className="space-y-2">
                <Label className="text-sm">
                  Departments
                  <span className="ml-1.5 text-xs text-muted-foreground font-normal">(select all that apply)</span>
                </Label>
                <div className="grid grid-cols-2 gap-1 border rounded-md p-3">
                  {DEPARTMENTS.map(dept => (
                    <div key={dept} className="flex items-center gap-2.5 min-h-[44px]">
                      <Checkbox
                        id={`dept-${dept}`}
                        checked={(formData.departments || []).includes(dept)}
                        onCheckedChange={() => toggleDepartment(dept)}
                        className="h-5 w-5"
                      />
                      <label
                        htmlFor={`dept-${dept}`}
                        className="text-sm cursor-pointer select-none font-medium flex-1 py-2"
                      >
                        {dept}
                      </label>
                    </div>
                  ))}
                </div>
                {(!formData.departments || formData.departments.length === 0) && (
                  <p className="text-xs text-destructive">Select at least one department</p>
                )}
                {formData.departments && formData.departments.length > 1 && (
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    ✓ This item will appear in {formData.departments.length} departments and tracked separately per department.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="low_stock_threshold" className="text-sm">Low Stock Threshold</Label>
                  <Input
                    id="low_stock_threshold"
                    type="number"
                    min="0"
                    value={formData.low_stock_threshold}
                    onChange={(e) => setFormData({ ...formData, low_stock_threshold: Number(e.target.value) })}
                    placeholder="0"
                    className="text-base sm:text-sm h-11 sm:h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit_cost" className="text-sm">Unit Cost ($)</Label>
                  <Input
                    id="unit_cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.unit_cost}
                    onChange={(e) => setFormData({ ...formData, unit_cost: Number(e.target.value) })}
                    placeholder="0.00"
                    className="text-base sm:text-sm h-11 sm:h-9"
                  />
                </div>
              </div>
            </form>
          </div>

          {/* Sticky footer — always visible at bottom */}
          <div className="shrink-0 flex flex-col sm:flex-row gap-2 p-4 sm:px-6 border-t bg-background">
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="w-full sm:w-auto h-11 sm:h-9 text-base sm:text-xs order-last sm:order-first">
              Cancel
            </Button>
            <Button
              type="submit"
              form="item-form"
              disabled={createItem.isPending || updateItem.isPending || !formData.departments?.length}
              className="w-full sm:w-auto h-11 sm:h-9 text-base sm:text-xs"
            >
              {editingItem ? 'Update Item' : 'Create Item'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="w-[90vw] max-w-md rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Are you sure you want to delete "{deletingItem?.name}"? This will remove it from all departments and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto min-h-[44px]">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto min-h-[44px]">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ItemManager;
