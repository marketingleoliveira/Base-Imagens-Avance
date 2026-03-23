import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Plus, Trash2, Pencil, FolderPlus, ArrowLeft, LayoutDashboard,
  Image as ImageIcon, Layers, FolderOpen,
} from "lucide-react";
import {
  fetchCategories,
  fetchAllSubcategories,
  fetchAllGalleries,
  addCategory,
  addSubcategory,
  deleteCategory,
  deleteSubcategory,
  updateCategory,
  updateSubcategory,
  createGallery,
  deleteGallery,
  updateGallery,
  fetchSubcategories,
  fetchImagesByGallery,
  uploadImage,
  saveImageRecord,
} from "@/lib/supabase-helpers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUploadForm } from "@/components/ImageUploadForm";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const queryClient = useQueryClient();

  return (
    <div className="min-h-screen bg-background">
      <header className="h-14 flex items-center border-b border-border px-6 gap-4 justify-between">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="w-5 h-5" />
          <h1 className="text-lg font-bold tracking-tight">Dashboard</h1>
        </div>
        <Link to="/">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-3 h-3" /> Voltar ao Catálogo
          </Button>
        </Link>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <Tabs defaultValue="categories" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="categories" className="gap-2">
              <Layers className="w-4 h-4" /> Categorias
            </TabsTrigger>
            <TabsTrigger value="galleries" className="gap-2">
              <FolderOpen className="w-4 h-4" /> Galerias
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2">
              <ImageIcon className="w-4 h-4" /> Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="categories">
            <CategoriesManager />
          </TabsContent>

          <TabsContent value="galleries">
            <GalleriesManager />
          </TabsContent>

          <TabsContent value="upload">
            <UploadManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

// =================== Categories Manager ===================

function CategoriesManager() {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [newSubName, setNewSubName] = useState("");
  const [subForCategory, setSubForCategory] = useState<string | null>(null);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editingSubName, setEditingSubName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ type: "category" | "subcategory"; id: string; name: string } | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const { data: allSubs = [] } = useQuery({
    queryKey: ["all-subcategories"],
    queryFn: fetchAllSubcategories,
  });

  const addCatMutation = useMutation({
    mutationFn: () => addCategory(newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoria criada!");
      setNewName("");
    },
    onError: () => toast.error("Erro ao criar categoria"),
  });

  const updateCatMutation = useMutation({
    mutationFn: () => updateCategory(editingId!, editingName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoria atualizada!");
      setEditingId(null);
    },
    onError: () => toast.error("Erro ao atualizar"),
  });

  const deleteCatMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["all-subcategories"] });
      toast.success("Categoria excluída!");
      setDeleteTarget(null);
    },
    onError: () => toast.error("Erro ao excluir"),
  });

  const addSubMutation = useMutation({
    mutationFn: () => addSubcategory(subForCategory!, newSubName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-subcategories"] });
      queryClient.invalidateQueries({ queryKey: ["subcategories"] });
      toast.success("Subcategoria criada!");
      setNewSubName("");
      setSubForCategory(null);
    },
    onError: () => toast.error("Erro ao criar subcategoria"),
  });

  const updateSubMutation = useMutation({
    mutationFn: () => updateSubcategory(editingSubId!, editingSubName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-subcategories"] });
      queryClient.invalidateQueries({ queryKey: ["subcategories"] });
      toast.success("Subcategoria atualizada!");
      setEditingSubId(null);
    },
    onError: () => toast.error("Erro ao atualizar"),
  });

  const deleteSubMutation = useMutation({
    mutationFn: (id: string) => deleteSubcategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-subcategories"] });
      queryClient.invalidateQueries({ queryKey: ["subcategories"] });
      toast.success("Subcategoria excluída!");
      setDeleteTarget(null);
    },
    onError: () => toast.error("Erro ao excluir"),
  });

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-5 space-y-4">
        <h3 className="font-semibold text-lg">Nova Categoria</h3>
        <div className="flex gap-3">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nome da categoria"
            className="max-w-sm"
            onKeyDown={(e) => e.key === "Enter" && newName.trim() && addCatMutation.mutate()}
          />
          <Button
            onClick={() => addCatMutation.mutate()}
            disabled={!newName.trim() || addCatMutation.isPending}
            className="gap-2"
          >
            <Plus className="w-4 h-4" /> Adicionar
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {categories.map((cat) => {
          const subs = allSubs.filter((s) => s.category_id === cat.id);
          const isExpanded = expandedCategory === cat.id;

          return (
            <div key={cat.id} className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="p-4 flex items-center justify-between">
                {editingId === cat.id ? (
                  <div className="flex gap-2 flex-1 mr-3">
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="max-w-xs"
                      onKeyDown={(e) => e.key === "Enter" && updateCatMutation.mutate()}
                    />
                    <Button size="sm" onClick={() => updateCatMutation.mutate()} disabled={updateCatMutation.isPending}>
                      Salvar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                    className="flex items-center gap-2 text-left"
                  >
                    <Layers className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold">{cat.name}</span>
                    <span className="text-xs text-muted-foreground">({subs.length} sub)</span>
                  </button>
                )}

                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => { setEditingId(cat.id); setEditingName(cat.name); }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteTarget({ type: "category", id: cat.id, name: cat.name })}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 text-xs"
                    onClick={() => { setSubForCategory(cat.id); setNewSubName(""); }}
                  >
                    <Plus className="w-3 h-3" /> Sub
                  </Button>
                </div>
              </div>

              {subs.length > 0 && (
                <div className="border-t border-border bg-muted/30">
                  {subs.map((sub) => (
                    <div key={sub.id} className="px-6 py-3 flex items-center justify-between border-b border-border last:border-0">
                      {editingSubId === sub.id ? (
                        <div className="flex gap-2 flex-1 mr-3">
                          <Input
                            value={editingSubName}
                            onChange={(e) => setEditingSubName(e.target.value)}
                            className="max-w-xs"
                            onKeyDown={(e) => e.key === "Enter" && updateSubMutation.mutate()}
                          />
                          <Button size="sm" onClick={() => updateSubMutation.mutate()} disabled={updateSubMutation.isPending}>
                            Salvar
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingSubId(null)}>
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <span className="text-sm">{sub.name}</span>
                      )}
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => { setEditingSubId(sub.id); setEditingSubName(sub.name); }}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteTarget({ type: "subcategory", id: sub.id, name: sub.name })}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Subcategory Dialog */}
      <Dialog open={!!subForCategory} onOpenChange={(open) => !open && setSubForCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Subcategoria</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={newSubName}
              onChange={(e) => setNewSubName(e.target.value)}
              placeholder="Nome da subcategoria"
              onKeyDown={(e) => e.key === "Enter" && newSubName.trim() && addSubMutation.mutate()}
            />
            <Button
              className="w-full"
              disabled={!newSubName.trim() || addSubMutation.isPending}
              onClick={() => addSubMutation.mutate()}
            >
              Criar Subcategoria
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Excluir {deleteTarget?.type === "category" ? "Categoria" : "Subcategoria"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deleteTarget?.name}</strong>?
              Todas as peças e galerias associadas serão excluídas permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!deleteTarget) return;
                if (deleteTarget.type === "category") deleteCatMutation.mutate(deleteTarget.id);
                else deleteSubMutation.mutate(deleteTarget.id);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// =================== Galleries Manager ===================

function GalleriesManager() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("");
  const [newCategoryId, setNewCategoryId] = useState("");
  const [newSubcategoryId, setNewSubcategoryId] = useState("");
  const [editingGallery, setEditingGallery] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [deleteGalleryId, setDeleteGalleryId] = useState<string | null>(null);

  const { data: galleries = [] } = useQuery({
    queryKey: ["all-galleries"],
    queryFn: fetchAllGalleries,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const { data: subsForNew = [] } = useQuery({
    queryKey: ["subcategories", newCategoryId],
    queryFn: () => fetchSubcategories(newCategoryId),
    enabled: !!newCategoryId,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createGallery({
        name: newName,
        category_id: newCategoryId,
        subcategory_id: newSubcategoryId || null,
        color: newColor || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-galleries"] });
      queryClient.invalidateQueries({ queryKey: ["galleries"] });
      toast.success("Galeria criada!");
      setShowCreate(false);
      setNewName("");
      setNewColor("");
      setNewCategoryId("");
      setNewSubcategoryId("");
    },
    onError: () => toast.error("Erro ao criar galeria"),
  });

  const updateMutation = useMutation({
    mutationFn: () => updateGallery(editingGallery!.id, { name: editName, color: editColor || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-galleries"] });
      queryClient.invalidateQueries({ queryKey: ["galleries"] });
      toast.success("Galeria atualizada!");
      setEditingGallery(null);
    },
    onError: () => toast.error("Erro ao atualizar galeria"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteGallery(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-galleries"] });
      queryClient.invalidateQueries({ queryKey: ["galleries"] });
      toast.success("Galeria excluída!");
      setDeleteGalleryId(null);
    },
    onError: () => toast.error("Erro ao excluir galeria"),
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">Galerias</h3>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <FolderPlus className="w-4 h-4" /> Nova Galeria
        </Button>
      </div>

      {galleries.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Nenhuma galeria cadastrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {galleries.map((gallery: any) => (
            <div key={gallery.id} className="bg-card border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{gallery.name}</p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {gallery.categories?.name && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                        {gallery.categories.name}
                      </span>
                    )}
                    {gallery.subcategories?.name && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                        {gallery.subcategories.name}
                      </span>
                    )}
                    {gallery.color && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                        {gallery.color}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1 text-xs"
                  onClick={() => {
                    setEditingGallery(gallery);
                    setEditName(gallery.name);
                    setEditColor(gallery.color || "");
                  }}
                >
                  <Pencil className="w-3 h-3" /> Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
                  onClick={() => setDeleteGalleryId(gallery.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Gallery Dialog */}
      <Dialog open={showCreate} onOpenChange={(open) => !open && setShowCreate(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Galeria</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome da galeria" />
            <Input value={newColor} onChange={(e) => setNewColor(e.target.value)} placeholder="Cor (opcional)" />
            <Select value={newCategoryId} onValueChange={(v) => { setNewCategoryId(v); setNewSubcategoryId(""); }}>
              <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {subsForNew.length > 0 && (
              <Select value={newSubcategoryId} onValueChange={setNewSubcategoryId}>
                <SelectTrigger><SelectValue placeholder="Subcategoria (opcional)" /></SelectTrigger>
                <SelectContent>
                  {subsForNew.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              className="w-full"
              disabled={!newName.trim() || !newCategoryId || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              Criar Galeria
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Gallery Dialog */}
      <Dialog open={!!editingGallery} onOpenChange={(open) => !open && setEditingGallery(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Galeria</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cor</label>
              <Input value={editColor} onChange={(e) => setEditColor(e.target.value)} placeholder="Cor (opcional)" />
            </div>
            <Button
              className="w-full"
              disabled={!editName.trim() || updateMutation.isPending}
              onClick={() => updateMutation.mutate()}
            >
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Gallery Confirm */}
      <AlertDialog open={!!deleteGalleryId} onOpenChange={(open) => !open && setDeleteGalleryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Galeria</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza? Todas as imagens desta galeria serão excluídas permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteGalleryId && deleteMutation.mutate(deleteGalleryId)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// =================== Upload Manager ===================

function UploadManager() {
  const queryClient = useQueryClient();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="font-semibold text-lg mb-4">Cadastrar Nova Peça</h3>
        <ImageUploadForm
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["images"] });
            queryClient.invalidateQueries({ queryKey: ["images-category"] });
            queryClient.invalidateQueries({ queryKey: ["all-galleries"] });
          }}
        />
      </div>
    </div>
  );
}

export default Dashboard;
