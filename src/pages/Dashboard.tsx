import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Plus, Trash2, Pencil, FolderPlus, ArrowLeft, LayoutDashboard,
  Image as ImageIcon, Layers, FolderOpen, Upload, FolderUp, Loader2,
} from "lucide-react";
import {
  fetchCategories,
  fetchAllSubcategories,
  fetchGalleries,
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
import { ImageUploadForm } from "@/components/ImageUploadForm";
import { GalleryView } from "@/components/GalleryView";
import { FolderUpload } from "@/components/FolderUpload";
import { Link } from "react-router-dom";
import logoAvance from "@/assets/logo_avance.png";

const Dashboard = () => {
  const queryClient = useQueryClient();

  return (
    <div className="min-h-screen bg-background">
      <header className="h-16 flex items-center border-b border-border px-6 gap-4 justify-between">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="w-5 h-5" />
          <h1 className="text-lg font-bold tracking-tight">Dashboard</h1>
        </div>
        <img src={logoAvance} alt="Avance" className="h-10 object-contain" />
        <Link to="/">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-3 h-3" /> Voltar ao Catálogo
          </Button>
        </Link>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <CategoriesManager />
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
  const [galleryView, setGalleryView] = useState<{ categoryId: string; subcategoryId: string | null; categoryName: string } | null>(null);

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

  // If gallery view is open, show it
  if (galleryView) {
    return (
      <CategoryGalleriesView
        categoryId={galleryView.categoryId}
        subcategoryId={galleryView.subcategoryId}
        categoryName={galleryView.categoryName}
        onBack={() => setGalleryView(null)}
      />
    );
  }

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
                    onClick={() => setExpandedCategory(expandedCategory === cat.id ? null : cat.id)}
                    className="flex items-center gap-2 text-left"
                  >
                    <Layers className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold">{cat.name}</span>
                    <span className="text-xs text-muted-foreground">({subs.length} sub)</span>
                  </button>
                )}

                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 text-xs"
                    onClick={() => setGalleryView({ categoryId: cat.id, subcategoryId: null, categoryName: cat.name })}
                  >
                    <FolderOpen className="w-3 h-3" /> Galerias
                  </Button>
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
                    <SubcategoryDropRow
                      key={sub.id}
                      sub={sub}
                      cat={cat}
                      editingSubId={editingSubId}
                      editingSubName={editingSubName}
                      setEditingSubName={setEditingSubName}
                      updateSubMutation={updateSubMutation}
                      setEditingSubId={setEditingSubId}
                      setEditingSubName_init={(name: string) => { setEditingSubId(sub.id); setEditingSubName(name); }}
                      setDeleteTarget={setDeleteTarget}
                      setGalleryView={setGalleryView}
                      onUploadSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ["galleries", cat.id, sub.id] });
                      }}
                    />
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

// =================== Category Galleries View ===================

function CategoryGalleriesView({
  categoryId,
  subcategoryId,
  categoryName,
  onBack,
}: {
  categoryId: string;
  subcategoryId: string | null;
  categoryName: string;
  onBack: () => void;
}) {
  const queryClient = useQueryClient();
  const [showCreateGallery, setShowCreateGallery] = useState(false);
  const [newGalleryName, setNewGalleryName] = useState("");
  const [newGalleryColor, setNewGalleryColor] = useState("");
  const [editingGallery, setEditingGallery] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [deleteGalleryId, setDeleteGalleryId] = useState<string | null>(null);
  const [selectedGalleryId, setSelectedGalleryId] = useState<string | null>(null);

  const { data: galleries = [] } = useQuery({
    queryKey: ["galleries", categoryId, subcategoryId],
    queryFn: () => fetchGalleries(categoryId, subcategoryId),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createGallery({
        name: newGalleryName,
        category_id: categoryId,
        subcategory_id: subcategoryId || null,
        color: newGalleryColor || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["galleries", categoryId, subcategoryId] });
      toast.success("Galeria criada!");
      setShowCreateGallery(false);
      setNewGalleryName("");
      setNewGalleryColor("");
    },
    onError: () => toast.error("Erro ao criar galeria"),
  });

  const updateMutation = useMutation({
    mutationFn: () => updateGallery(editingGallery!.id, { name: editName, color: editColor || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["galleries", categoryId, subcategoryId] });
      toast.success("Galeria atualizada!");
      setEditingGallery(null);
    },
    onError: () => toast.error("Erro ao atualizar galeria"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteGallery(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["galleries", categoryId, subcategoryId] });
      toast.success("Galeria excluída!");
      setDeleteGalleryId(null);
    },
    onError: () => toast.error("Erro ao excluir galeria"),
  });

  // If a gallery is selected, show its images with upload
  if (selectedGalleryId) {
    const gallery = galleries.find((g) => g.id === selectedGalleryId);
    return (
      <GalleryView
        galleryId={selectedGalleryId}
        galleryName={gallery?.name || ""}
        categoryId={categoryId}
        categoryName={categoryName}
        subcategoryId={subcategoryId}
        onBack={() => setSelectedGalleryId(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Galerias</p>
            <h3 className="text-xl font-bold">{categoryName}</h3>
          </div>
        </div>
        <div className="flex gap-2">
          <FolderUpload
            categoryId={categoryId}
            subcategoryId={subcategoryId}
            onSuccess={() => queryClient.invalidateQueries({ queryKey: ["galleries", categoryId, subcategoryId] })}
          />
          <Button onClick={() => setShowCreateGallery(true)} className="gap-2">
            <FolderPlus className="w-4 h-4" /> Nova Galeria
          </Button>
        </div>
      </div>

      {galleries.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Nenhuma galeria nesta categoria</p>
          <p className="text-sm mt-1">Crie uma galeria para fazer upload de imagens</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {galleries.map((gallery: any) => (
            <div key={gallery.id} className="bg-card border border-border rounded-lg overflow-hidden group hover:shadow-md transition-shadow">
              <button
                onClick={() => setSelectedGalleryId(gallery.id)}
                className="w-full text-left"
              >
                <div className="aspect-video overflow-hidden bg-muted flex items-center justify-center">
                  <FolderOpen className="w-10 h-10 text-muted-foreground/30" />
                </div>
                <div className="p-3">
                  <p className="font-semibold text-sm">{gallery.name}</p>
                  {gallery.color && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground mt-1 inline-block">
                      {gallery.color}
                    </span>
                  )}
                </div>
              </button>
              <div className="px-3 pb-3 flex gap-1">
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
      <Dialog open={showCreateGallery} onOpenChange={(open) => !open && setShowCreateGallery(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Galeria</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input value={newGalleryName} onChange={(e) => setNewGalleryName(e.target.value)} placeholder="Nome da galeria" />
            <Input value={newGalleryColor} onChange={(e) => setNewGalleryColor(e.target.value)} placeholder="Cor (opcional)" />
            <Button
              className="w-full"
              disabled={!newGalleryName.trim() || createMutation.isPending}
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
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Nome" />
            <Input value={editColor} onChange={(e) => setEditColor(e.target.value)} placeholder="Cor (opcional)" />
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

export default Dashboard;
