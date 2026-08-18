import { useState } from 'react';
import { useItems, useCreateItem, useUpdateItem, useDeleteItem, Item, CreateItemInput } from '@/hooks/useItems';
import { useAuth } from '@/contexts/AuthContext';
import { DEPARTMENTS } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Search, Building2, Info, Lock, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { id: 'Beverages', label: '🥤 Beverages', color: 'hover:border-blue-500' },
  { id: 'Food', label: '🍿 Food & Snacks', color: 'hover:border-amber-500' },
  { id: 'Supplies', label: '📦 Supplies', color: 'hover:border-emerald-500' },
  { id: 'Cleaning', label: '🧹 Cleaning', color: 'hover:border-cyan-500' },
  { id: 'Equipment', label: '⚙️ Equipment', color: 'hover:border-purple-500' },
  { id: 'Other', label: '🏷️ Other', color: 'hover:border-slate-500' },
];

const UNITS = [
  { id: 'pcs', label: 'pcs (Pieces)' },
  { id: 'bottle', label: 'bottle' },
  { id: 'can', label: 'can' },
  { id: 'pack', label: 'pack' },
  { id: 'kg', label: 'kg' },
  { id: 'ltr', label: 'ltr' },
  { id: 'box', label: 'box' },
  { id: 'roll', label: 'roll' },
];

const THRESHOLD_PRESETS = [0, 5, 10, 20, 50];
const COST_PRESETS = [500, 1000, 1500, 2000, 5000];

export default function ItemManager() {
  const { canManageItems } = useAuth();
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
    category: 'Beverages',
    department: 'Retail',
    departments: ['Retail'],
    unit_of_measure: 'pcs',
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
        category: item.category || 'Beverages',
        department: item.department || 'Retail',
        departments: item.departments?.length ? item.departments : [item.department || 'Retail'],
        unit_of_measure: item.unit_of_measure || 'pcs',
        low_stock_threshold: item.low_stock_threshold || 0,
        unit_cost: item.unit_cost || 0,
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        category: 'Beverages',
        department: 'Retail',
        departments: ['Retail'],
        unit_of_measure: 'pcs',
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

  const selectAllDepartments = () => {
    setFormData({
      ...formData,
      departments: [...DEPARTMENTS],
      department: 'Retail',
    });
  };

  const clearAllDepartments = () => {
    setFormData({
      ...formData,
      departments: ['Retail'],
      department: 'Retail',
    });
  };

  const toTitleCase = (str: string) => {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
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
            Manage your master inventory catalog with multi-choice quick item details
          </p>
        </div>
        {canManageItems ? (
          <Button onClick={() => handleOpenForm()} className="w-full sm:w-auto h-11 sm:h-9 text-base sm:text-xs">
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-md border">
            <Lock className="h-3.5 w-3.5" />
            <span>Manager access required to edit items</span>
          </div>
        )}
      </div>

      {/* Info Banner: Multi-Department Items */}
      <div className="flex items-start gap-3 p-3 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 text-xs sm:text-sm text-blue-800 dark:text-blue-300">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <span>
          <strong>Shared Items:</strong> Each item can be assigned to multiple departments. The same physical item (e.g. <em>Mineral Water</em> or <em>Cups</em>) can appear in <em>Bar</em>, <em>Cube</em>, and <em>Retail</em> simultaneously — tracked separately per department in the Stock Count.
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
              <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Mobile Card-List Layout (shown on screens < md) */}
      <div className="space-y-3 md:hidden">
        {!filteredItems || filteredItems.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 text-sm border rounded-lg p-4">
            No items found.
          </div>
        ) : (
          filteredItems.map(item => (
            <div key={item.id} className="rounded-lg border p-4 space-y-2 bg-card">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-base">{item.name}</h3>
                  <p className="text-xs text-muted-foreground">{item.category} · {item.unit_of_measure}</p>
                </div>
                {canManageItems && (
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleOpenForm(item)}
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => {
                        setDeletingItem(item);
                        setIsDeleteOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-1 pt-1">
                {(item.departments && item.departments.length > 0 ? item.departments : [item.department || 'Retail']).map(dept => (
                  <Badge key={dept} variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                    {dept}
                  </Badge>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs text-muted-foreground">
                <div>
                  <span className="font-medium text-foreground">₦{Number(item.unit_cost || 0).toLocaleString()}</span>
                  <span className="text-[10px] block">Unit Cost</span>
                </div>
                <div>
                  <span className="font-medium text-foreground">{item.low_stock_threshold}</span>
                  <span className="text-[10px] block">Low Stock Alert</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Departments</TableHead>
              <TableHead className="text-right">Unit Cost (₦)</TableHead>
              <TableHead className="text-right">Low Stock Alert</TableHead>
              {canManageItems && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {!filteredItems || filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No items found.
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {item.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{item.unit_of_measure}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[220px]">
                      {(item.departments && item.departments.length > 0 ? item.departments : [item.department || 'Retail']).map(dept => (
                        <Badge key={dept} variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                          {dept}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ₦{Number(item.unit_cost || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">{item.low_stock_threshold}</TableCell>
                  {canManageItems && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenForm(item)}
                        >
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => {
                            setDeletingItem(item);
                            setIsDeleteOpen(true);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Item Details MCQ Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-xl w-[95vw] max-h-[92vh] flex flex-col p-0 overflow-hidden">
          <div className="p-4 sm:p-6 border-b shrink-0 bg-background">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {editingItem ? 'Edit Item Details' : 'Add New Item'}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Configure item attributes using quick multi-choice options.
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 min-h-0">
            <form id="item-form" onSubmit={handleSubmit} className="space-y-5">
              {/* Item Name */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="name" className="text-xs font-semibold">Item Name</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1.5 text-[10px] text-muted-foreground"
                    onClick={() => setFormData(prev => ({ ...prev, name: toTitleCase(prev.name) }))}
                  >
                    <Sparkles className="h-3 w-3 mr-1" /> Title Case
                  </Button>
                </div>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Mineral Water 75cl, Long Island Cocktail"
                  className="text-sm h-10"
                  required
                />
              </div>

              {/* Category: MCQ Pills */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">
                  Category <span className="text-muted-foreground font-normal">(select one)</span>
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORIES.map(cat => {
                    const isSelected = formData.category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: cat.id })}
                        className={cn(
                          'flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-medium transition-all text-left',
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary'
                            : 'border-border bg-card hover:bg-muted/60 text-muted-foreground'
                        )}
                      >
                        <span>{cat.label}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Unit of Measure: MCQ Pills */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">
                  Unit of Measure <span className="text-muted-foreground font-normal">(select unit)</span>
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {UNITS.map(u => {
                    const isSelected = formData.unit_of_measure === u.id;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, unit_of_measure: u.id })}
                        className={cn(
                          'px-3 py-1.5 rounded-md border text-xs font-medium transition-all',
                          isSelected
                            ? 'border-primary bg-primary text-primary-foreground font-semibold shadow-sm'
                            : 'border-border bg-card hover:bg-muted text-muted-foreground'
                        )}
                      >
                        {u.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Multi-Department Assignment: Multi-Choice Cards */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">
                    Departments <span className="text-muted-foreground font-normal">(stocked locations)</span>
                  </Label>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1.5 text-[10px]"
                      onClick={selectAllDepartments}
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1.5 text-[10px]"
                      onClick={clearAllDepartments}
                    >
                      Reset
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border rounded-lg p-3 bg-muted/20">
                  {DEPARTMENTS.map(dept => {
                    const isSelected = (formData.departments || []).includes(dept);
                    return (
                      <div
                        key={dept}
                        onClick={() => toggleDepartment(dept)}
                        className={cn(
                          'flex items-center gap-2 p-2 rounded-md border text-xs font-medium cursor-pointer transition-all select-none',
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary font-semibold'
                            : 'border-transparent hover:bg-muted text-muted-foreground'
                        )}
                      >
                        <Checkbox
                          id={`dept-${dept}`}
                          checked={isSelected}
                          className="h-4 w-4 pointer-events-none"
                          tabIndex={-1}
                        />
                        <span>{dept}</span>
                      </div>
                    );
                  })}
                </div>
                {(!formData.departments || formData.departments.length === 0) && (
                  <p className="text-xs text-destructive">Please select at least one department</p>
                )}
              </div>

              {/* Threshold & Unit Cost with Quick Presets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="low_stock_threshold" className="text-xs font-semibold">Low Stock Threshold</Label>
                  <Input
                    id="low_stock_threshold"
                    type="number"
                    min="0"
                    value={formData.low_stock_threshold}
                    onChange={(e) => setFormData({ ...formData, low_stock_threshold: Number(e.target.value) })}
                    className="h-9 text-sm"
                  />
                  <div className="flex gap-1 flex-wrap pt-1">
                    {THRESHOLD_PRESETS.map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setFormData({ ...formData, low_stock_threshold: preset })}
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] border transition-colors",
                          formData.low_stock_threshold === preset ? "bg-primary text-primary-foreground font-bold" : "bg-muted hover:bg-muted/80 text-muted-foreground"
                        )}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="unit_cost" className="text-xs font-semibold">Unit Cost (₦)</Label>
                  <Input
                    id="unit_cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.unit_cost}
                    onChange={(e) => setFormData({ ...formData, unit_cost: Number(e.target.value) })}
                    className="h-9 text-sm"
                  />
                  <div className="flex gap-1 flex-wrap pt-1">
                    {COST_PRESETS.map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setFormData({ ...formData, unit_cost: preset })}
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] border transition-colors",
                          formData.unit_cost === preset ? "bg-primary text-primary-foreground font-bold" : "bg-muted hover:bg-muted/80 text-muted-foreground"
                        )}
                      >
                        ₦{preset.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="shrink-0 p-4 sm:p-6 border-t bg-background flex flex-col sm:flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFormOpen(false)}
              className="w-full sm:w-auto h-10 text-xs order-last sm:order-first"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="item-form"
              disabled={createItem.isPending || updateItem.isPending || !formData.departments?.length}
              className="w-full sm:w-auto h-10 text-xs"
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
}
