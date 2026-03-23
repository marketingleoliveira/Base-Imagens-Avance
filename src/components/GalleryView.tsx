import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Plus, Copy, ExternalLink, Trash2, ArrowRightLeft, Pencil, Check, X } from "lucide-react";
import {
  fetchImagesByGallery,
  uploadImage,
  saveImageRecord,
  deleteImage,
  updateImageCategory,
  fetchCategories,
  fetchSubcategories,
  updateGallery,
} from "@/lib/supabase-helpers";
import { ImageUploadForm } from "@/components/ImageUploadForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GalleryViewProps {
  galleryId: string;
  galleryName: string;
  categoryId: string;
  categoryName: string;
  subcategoryId: string | null;
  onBack: () => void;
}

export function GalleryView({
  galleryId,
  galleryName,
  categoryId,
  categoryName,
  subcategoryId,
  onBack,
}: GalleryViewProps) {
  const queryClient = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(galleryName);
  const [transferImageId, setTransferImageId] = useState<string | null>(null);
  const [transferCategoryId, setTransferCategoryId] = useState("");
  const [transferSubcategoryId, setTransferSubcategoryId] = useState("");

  const { data: images = [], isLoading } = useQuery({
    queryKey: ["gallery-images", galleryId],
    queryFn: () => fetchImagesByGallery(galleryId),
  });

  const { data: allCategories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const { data: transferSubs = [] } = useQuery({
    queryKey: ["subcategories", transferCategoryId],
    queryFn: () => fetchSubcategories(transferCategoryId),
    enabled: !!transferCategoryId,
  });

  const renameMutation = useMutation({
    mutationFn: () => updateGallery(galleryId, { name: nameValue }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-images", galleryId] });
      queryClient.invalidateQueries({ queryKey: ["galleries"] });
      toast.success("Nome da galeria atualizado!");
      setEditingName(false);
    },
    onError: () => toast.error("Erro ao renomear galeria"),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, filePath }: { id: string; filePath: string }) => deleteImage(id, filePath),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-images", galleryId] });
      queryClient.invalidateQueries({ queryKey: ["images-category", categoryId] });
      toast.success("Imagem removida!");
    },
    onError: () => toast.error("Erro ao remover imagem"),
  });

  const transferMutation = useMutation({
    mutationFn: () =>
      updateImageCategory(transferImageId!, transferCategoryId, transferSubcategoryId || null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-images", galleryId] });
      queryClient.invalidateQueries({ queryKey: ["images-category"] });
      toast.success("Peça transferida!");
      setTransferImageId(null);
    },
    onError: () => toast.error("Erro ao transferir peça"),
  });

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copiada!");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">{categoryName}</p>
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  className="h-8 text-lg font-bold"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && nameValue.trim()) renameMutation.mutate();
                    if (e.key === "Escape") { setEditingName(false); setNameValue(galleryName); }
                  }}
                  autoFocus
                />
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => renameMutation.mutate()} disabled={!nameValue.trim() || renameMutation.isPending}>
                  <Check className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingName(false); setNameValue(galleryName); }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold tracking-tight">{nameValue}</h2>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingName(true)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
        <Button onClick={() => setShowUpload(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Adicionar Imagem
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg">Nenhuma imagem nesta galeria</p>
          <p className="text-sm mt-1">Clique em "Adicionar Imagem" para começar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {images.map((img) => (
            <div
              key={img.id}
              className="bg-card border border-border rounded-lg overflow-hidden group hover:shadow-md transition-shadow"
            >
              <div className="aspect-square overflow-hidden bg-muted">
                <img
                  src={img.public_url}
                  alt={img.file_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-3 space-y-2">
                <p className="font-medium text-sm truncate">{img.file_name}</p>

                <div className="flex flex-wrap gap-1">
                  {img.color && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                      {img.color}
                    </span>
                  )}
                  {img.size && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                      {img.size}
                    </span>
                  )}
                </div>

                {img.composition && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Composição:</span> {img.composition}
                  </p>
                )}
                {img.measurements && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Medidas:</span> {img.measurements}
                  </p>
                )}

                <div className="bg-muted rounded p-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 font-medium">URL</p>
                  <div className="flex items-center gap-1">
                    <code className="text-[11px] flex-1 truncate">{img.public_url}</code>
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => copyUrl(img.public_url)}>
                      <Copy className="w-3 h-3" />
                    </Button>
                    <a href={img.public_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </a>
                  </div>
                </div>

                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs gap-1"
                    onClick={() => {
                      setTransferImageId(img.id);
                      setTransferCategoryId("");
                      setTransferSubcategoryId("");
                    }}
                  >
                    <ArrowRightLeft className="w-3 h-3" />
                    Transferir
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
                    onClick={() => deleteMutation.mutate({ id: img.id, filePath: img.file_path })}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={(open) => !open && setShowUpload(false)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Imagem — {galleryName}</DialogTitle>
          </DialogHeader>
          <ImageUploadForm
            defaultCategoryId={categoryId}
            defaultSubcategoryId={subcategoryId}
            defaultGalleryId={galleryId}
            onSuccess={() => {
              setShowUpload(false);
              queryClient.invalidateQueries({ queryKey: ["gallery-images", galleryId] });
              queryClient.invalidateQueries({ queryKey: ["images-category", categoryId] });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={!!transferImageId} onOpenChange={(open) => !open && setTransferImageId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transferir Peça</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Nova Categoria
              </label>
              <Select value={transferCategoryId} onValueChange={(v) => { setTransferCategoryId(v); setTransferSubcategoryId(""); }}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {allCategories.filter((c) => c.id !== categoryId).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {transferSubs.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Subcategoria
                </label>
                <Select value={transferSubcategoryId} onValueChange={setTransferSubcategoryId}>
                  <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                  <SelectContent>
                    {transferSubs.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button
              className="w-full"
              disabled={!transferCategoryId || transferMutation.isPending}
              onClick={() => transferMutation.mutate()}
            >
              Confirmar Transferência
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
