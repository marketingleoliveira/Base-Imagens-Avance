import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, ArrowLeft, Trash2, FolderPlus, FolderUp, Loader2 } from "lucide-react";
import {
  fetchImagesByCategory,
  fetchSubcategories,
  fetchCategories,
  addCategory,
  addSubcategory,
  deleteCategory,
  deleteSubcategory,
  fetchGalleries,
  createGallery,
  deleteGallery,
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
import { GalleryView } from "@/components/GalleryView";

interface CategoryViewProps {
  categoryId: string;
  categoryName: string;
  selectedSubcategoryId: string | null;
  onSelectSubcategory: (subId: string | null) => void;
  onCategoryDeleted: () => void;
}

export function CategoryView({
  categoryId,
  categoryName,
  selectedSubcategoryId,
  onSelectSubcategory,
  onCategoryDeleted,
}: CategoryViewProps) {
  const queryClient = useQueryClient();
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddSubcategory, setShowAddSubcategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "category" | "subcategory"; id: string; name: string; count: number } | null>(null);
  const [selectedGalleryId, setSelectedGalleryId] = useState<string | null>(null);
  const [showCreateGallery, setShowCreateGallery] = useState(false);
  const [newGalleryName, setNewGalleryName] = useState("");
  const [newGalleryColor, setNewGalleryColor] = useState("");

  const { data: images = [] } = useQuery({
    queryKey: ["images-category", categoryId],
    queryFn: () => fetchImagesByCategory(categoryId),
  });

  const { data: subcategories = [] } = useQuery({
    queryKey: ["subcategories", categoryId],
    queryFn: () => fetchSubcategories(categoryId),
  });

  const { data: galleries = [] } = useQuery({
    queryKey: ["galleries", categoryId, selectedSubcategoryId],
    queryFn: () => fetchGalleries(categoryId, selectedSubcategoryId),
  });

  const addCategoryMutation = useMutation({
    mutationFn: (name: string) => addCategory(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoria adicionada!");
      setShowAddCategory(false);
      setNewCategoryName("");
    },
    onError: () => toast.error("Erro ao adicionar categoria"),
  });

  const addSubcategoryMutation = useMutation({
    mutationFn: (name: string) => addSubcategory(categoryId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subcategories", categoryId] });
      toast.success("Subcategoria adicionada!");
      setShowAddSubcategory(false);
      setNewSubcategoryName("");
    },
    onError: () => toast.error("Erro ao adicionar subcategoria"),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["images-category"] });
      toast.success("Categoria excluída!");
      setDeleteConfirm(null);
      onCategoryDeleted();
    },
    onError: () => toast.error("Erro ao excluir categoria"),
  });

  const deleteSubcategoryMutation = useMutation({
    mutationFn: (id: string) => deleteSubcategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subcategories", categoryId] });
      queryClient.invalidateQueries({ queryKey: ["images-category", categoryId] });
      toast.success("Subcategoria excluída!");
      setDeleteConfirm(null);
      onSelectSubcategory(null);
    },
    onError: () => toast.error("Erro ao excluir subcategoria"),
  });

  const createGalleryMutation = useMutation({
    mutationFn: () =>
      createGallery({
        name: newGalleryName,
        category_id: categoryId,
        subcategory_id: selectedSubcategoryId || null,
        color: newGalleryColor || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["galleries", categoryId, selectedSubcategoryId] });
      toast.success("Galeria criada!");
      setShowCreateGallery(false);
      setNewGalleryName("");
      setNewGalleryColor("");
    },
    onError: () => toast.error("Erro ao criar galeria"),
  });

  const deleteGalleryMutation = useMutation({
    mutationFn: (id: string) => deleteGallery(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["galleries", categoryId, selectedSubcategoryId] });
      queryClient.invalidateQueries({ queryKey: ["images-category", categoryId] });
      toast.success("Galeria excluída!");
    },
    onError: () => toast.error("Erro ao excluir galeria"),
  });

  // If a gallery is selected, show gallery detail view
  if (selectedGalleryId) {
    const gallery = galleries.find((g) => g.id === selectedGalleryId);
    return (
      <GalleryView
        galleryId={selectedGalleryId}
        galleryName={gallery?.name || ""}
        categoryId={categoryId}
        categoryName={categoryName}
        subcategoryId={selectedSubcategoryId}
        onBack={() => setSelectedGalleryId(null)}
      />
    );
  }

  // If no subcategory selected, show subcategory picker
  if (!selectedSubcategoryId && subcategories.length > 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">{categoryName}</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowAddCategory(true)} className="gap-1">
              <Plus className="w-3 h-3" /> Categoria
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowAddSubcategory(true)} className="gap-1">
              <Plus className="w-3 h-3" /> Subcategoria
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
              onClick={() => {
                const count = images.length;
                setDeleteConfirm({ type: "category", id: categoryId, name: categoryName, count });
              }}
            >
              <Trash2 className="w-3 h-3" /> Excluir
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {subcategories.map((sub) => {
            const count = images.filter((img) => img.subcategory_id === sub.id).length;
            return (
              <div key={sub.id} className="flex items-center gap-2">
                <button
                  onClick={() => onSelectSubcategory(sub.id)}
                  className="flex-1 flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-accent transition-colors text-left"
                >
                  <span className="font-semibold tracking-wide">{sub.name}</span>
                  <span className="text-sm text-muted-foreground">{count} peças</span>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                  onClick={() => {
                    const subCount = images.filter((img) => img.subcategory_id === sub.id).length;
                    setDeleteConfirm({ type: "subcategory", id: sub.id, name: sub.name, count: subCount });
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>

        {/* Dialogs */}
        <AddCategoryDialog
          show={showAddCategory}
          onClose={() => setShowAddCategory(false)}
          name={newCategoryName}
          setName={setNewCategoryName}
          onSubmit={() => addCategoryMutation.mutate(newCategoryName)}
          isPending={addCategoryMutation.isPending}
        />
        <AddSubcategoryDialog
          show={showAddSubcategory}
          onClose={() => setShowAddSubcategory(false)}
          name={newSubcategoryName}
          setName={setNewSubcategoryName}
          onSubmit={() => addSubcategoryMutation.mutate(newSubcategoryName)}
          isPending={addSubcategoryMutation.isPending}
        />
        <DeleteConfirmDialog
          data={deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={() => {
            if (!deleteConfirm) return;
            if (deleteConfirm.type === "category") deleteCategoryMutation.mutate(deleteConfirm.id);
            else deleteSubcategoryMutation.mutate(deleteConfirm.id);
          }}
          isPending={deleteCategoryMutation.isPending || deleteSubcategoryMutation.isPending}
        />
      </div>
    );
  }

  // Subcategory selected or no subcategories — show galleries grouped by color
  const subName = subcategories.find((s) => s.id === selectedSubcategoryId)?.name || "";
  const relevantImages = selectedSubcategoryId
    ? images.filter((img) => img.subcategory_id === selectedSubcategoryId)
    : images;

  // Get unique colors from galleries
  const colors = Array.from(new Set(galleries.map((g) => g.color).filter(Boolean))) as string[];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {selectedSubcategoryId && (
            <Button variant="ghost" size="icon" onClick={() => onSelectSubcategory(null)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">{categoryName}</p>
            <h2 className="text-2xl font-bold tracking-tight">{subName || categoryName}</h2>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setShowCreateGallery(true)} className="gap-1">
            <FolderPlus className="w-3 h-3" /> Nova Galeria
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowAddCategory(true)} className="gap-1">
            <Plus className="w-3 h-3" /> Categoria
          </Button>
          {!selectedSubcategoryId && (
            <Button variant="outline" size="sm" onClick={() => setShowAddSubcategory(true)} className="gap-1">
              <Plus className="w-3 h-3" /> Subcategoria
            </Button>
          )}
          {selectedSubcategoryId && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
              onClick={() => {
                const subCount = relevantImages.length;
                setDeleteConfirm({ type: "subcategory", id: selectedSubcategoryId, name: subName, count: subCount });
              }}
            >
              <Trash2 className="w-3 h-3" /> Excluir Sub
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
            onClick={() => {
              setDeleteConfirm({ type: "category", id: categoryId, name: categoryName, count: images.length });
            }}
          >
            <Trash2 className="w-3 h-3" /> Excluir Cat
          </Button>
        </div>
      </div>

      {/* Color filter buttons */}
      {colors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {colors.map((color) => (
            <span
              key={color}
              className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-medium"
            >
              {color}
            </span>
          ))}
        </div>
      )}

      {/* Galleries grid */}
      {galleries.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <FolderPlus className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg">Nenhuma galeria criada</p>
          <p className="text-sm mt-1">Clique em "Nova Galeria" para começar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {galleries.map((gallery) => {
            const galleryImages = relevantImages.filter((img) => img.gallery_id === gallery.id);
            const thumb = galleryImages[0]?.public_url;
            return (
              <div
                key={gallery.id}
                className="bg-card border border-border rounded-lg overflow-hidden group hover:shadow-md transition-shadow cursor-pointer"
              >
                <button
                  onClick={() => setSelectedGalleryId(gallery.id)}
                  className="w-full text-left"
                >
                  <div className="aspect-video overflow-hidden bg-muted flex items-center justify-center">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={gallery.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <FolderPlus className="w-10 h-10 text-muted-foreground/30" />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-sm">{gallery.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {gallery.color && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                          {gallery.color}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">{galleryImages.length} imagens</span>
                    </div>
                  </div>
                </button>
                <div className="px-3 pb-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteGalleryMutation.mutate(gallery.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3 mr-1" /> Excluir Galeria
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dialogs */}
      <AddCategoryDialog
        show={showAddCategory}
        onClose={() => setShowAddCategory(false)}
        name={newCategoryName}
        setName={setNewCategoryName}
        onSubmit={() => addCategoryMutation.mutate(newCategoryName)}
        isPending={addCategoryMutation.isPending}
      />
      <AddSubcategoryDialog
        show={showAddSubcategory}
        onClose={() => setShowAddSubcategory(false)}
        name={newSubcategoryName}
        setName={setNewSubcategoryName}
        onSubmit={() => addSubcategoryMutation.mutate(newSubcategoryName)}
        isPending={addSubcategoryMutation.isPending}
      />
      <DeleteConfirmDialog
        data={deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => {
          if (!deleteConfirm) return;
          if (deleteConfirm.type === "category") deleteCategoryMutation.mutate(deleteConfirm.id);
          else deleteSubcategoryMutation.mutate(deleteConfirm.id);
        }}
        isPending={deleteCategoryMutation.isPending || deleteSubcategoryMutation.isPending}
      />

      {/* Create Gallery Dialog */}
      <Dialog open={showCreateGallery} onOpenChange={(open) => !open && setShowCreateGallery(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Galeria</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome da Galeria</label>
              <Input
                value={newGalleryName}
                onChange={(e) => setNewGalleryName(e.target.value)}
                placeholder="Ex: Coleção Verão 2026"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cor (opcional)</label>
              <Input
                value={newGalleryColor}
                onChange={(e) => setNewGalleryColor(e.target.value)}
                placeholder="Ex: Preto"
              />
            </div>
            <Button
              className="w-full"
              disabled={!newGalleryName.trim() || createGalleryMutation.isPending}
              onClick={() => createGalleryMutation.mutate()}
            >
              Criar Galeria
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- Sub-components ---

function AddCategoryDialog({ show, onClose, name, setName, onSubmit, isPending }: any) {
  return (
    <Dialog open={show} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Categoria</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            value={name}
            onChange={(e: any) => setName(e.target.value)}
            placeholder="Nome da categoria"
          />
          <Button className="w-full" disabled={!name.trim() || isPending} onClick={onSubmit}>
            Adicionar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddSubcategoryDialog({ show, onClose, name, setName, onSubmit, isPending }: any) {
  return (
    <Dialog open={show} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Subcategoria</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            value={name}
            onChange={(e: any) => setName(e.target.value)}
            placeholder="Nome da subcategoria"
          />
          <Button className="w-full" disabled={!name.trim() || isPending} onClick={onSubmit}>
            Adicionar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DeleteConfirmDialog({ data, onClose, onConfirm, isPending }: any) {
  return (
    <AlertDialog open={!!data} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir {data?.type === "category" ? "Categoria" : "Subcategoria"}</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir <strong>{data?.name}</strong>?
            {data?.count > 0 && (
              <span className="block mt-2 text-destructive font-medium">
                ⚠️ {data.count} peça(s) serão excluídas permanentemente.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
