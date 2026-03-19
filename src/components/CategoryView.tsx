import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy, Trash2, ExternalLink, Plus, ArrowRightLeft } from "lucide-react";
import {
  fetchImagesByCategory,
  fetchSubcategories,
  fetchCategories,
  deleteImage,
  updateImageCategory,
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

interface CategoryViewProps {
  categoryId: string;
  categoryName: string;
  selectedSubcategoryId: string | null;
}

export function CategoryView({ categoryId, categoryName, selectedSubcategoryId }: CategoryViewProps) {
  const queryClient = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);
  const [transferImageId, setTransferImageId] = useState<string | null>(null);
  const [transferCategoryId, setTransferCategoryId] = useState("");
  const [transferSubcategoryId, setTransferSubcategoryId] = useState("");

  const { data: images = [], isLoading } = useQuery({
    queryKey: ["images-category", categoryId],
    queryFn: () => fetchImagesByCategory(categoryId),
  });

  const { data: subcategories = [] } = useQuery({
    queryKey: ["subcategories", categoryId],
    queryFn: () => fetchSubcategories(categoryId),
  });

  const { data: allCategories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, filePath }: { id: string; filePath: string }) => deleteImage(id, filePath),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["images-category", categoryId] });
      toast.success("Imagem removida!");
    },
    onError: () => toast.error("Erro ao remover imagem"),
  });

  const transferMutation = useMutation({
    mutationFn: () =>
      updateImageCategory(transferImageId!, transferCategoryId, transferSubcategoryId || null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["images-category"] });
      toast.success("Peça transferida!");
      setTransferImageId(null);
      setTransferCategoryId("");
      setTransferSubcategoryId("");
    },
    onError: () => toast.error("Erro ao transferir peça"),
  });

  const { data: transferSubs = [] } = useQuery({
    queryKey: ["subcategories", transferCategoryId],
    queryFn: () => fetchSubcategories(transferCategoryId),
    enabled: !!transferCategoryId,
  });

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copiada!");
  };

  const filteredImages = selectedSubcategoryId
    ? images.filter((img) => img.subcategory_id === selectedSubcategoryId)
    : images;

  // Group by subcategory
  const grouped = new Map<string, typeof filteredImages>();
  filteredImages.forEach((img) => {
    const subName = (img.subcategories as any)?.name || "Sem subcategoria";
    if (!grouped.has(subName)) grouped.set(subName, []);
    grouped.get(subName)!.push(img);
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">{categoryName}</h2>
        <Button onClick={() => setShowUpload(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Adicionar Peça
        </Button>
      </div>

      {filteredImages.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg">Nenhuma peça cadastrada</p>
          <p className="text-sm mt-1">Clique em "Adicionar Peça" para começar</p>
        </div>
      ) : (
        Array.from(grouped.entries()).map(([subName, items]) => (
          <div key={subName} className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground border-b border-border pb-2">
              {subName}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {items.map((img) => (
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

                    {/* URL */}
                    <div className="bg-muted rounded p-2">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 font-medium">
                        URL
                      </p>
                      <div className="flex items-center gap-1">
                        <code className="text-[11px] flex-1 truncate">{img.public_url}</code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => copyUrl(img.public_url)}
                        >
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
          </div>
        ))
      )}

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Peça — {categoryName}</DialogTitle>
          </DialogHeader>
          <ImageUploadForm
            defaultCategoryId={categoryId}
            onSuccess={() => {
              setShowUpload(false);
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
