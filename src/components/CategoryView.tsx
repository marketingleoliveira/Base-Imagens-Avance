import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy, Trash2, ExternalLink, Plus, ArrowRightLeft, ArrowLeft } from "lucide-react";
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
  onSelectSubcategory: (subId: string | null) => void;
}

export function CategoryView({ categoryId, categoryName, selectedSubcategoryId, onSelectSubcategory }: CategoryViewProps) {
  const queryClient = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);
  const [transferImageId, setTransferImageId] = useState<string | null>(null);
  const [transferCategoryId, setTransferCategoryId] = useState("");
  const [transferSubcategoryId, setTransferSubcategoryId] = useState("");
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

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

  // If no subcategory selected, show subcategory picker
  if (!selectedSubcategoryId) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">{categoryName}</h2>
          <Button onClick={() => setShowUpload(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Adicionar Peça
          </Button>
        </div>

        {subcategories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {subcategories.map((sub) => {
              const count = images.filter((img) => img.subcategory_id === sub.id).length;
              return (
                <button
                  key={sub.id}
                  onClick={() => onSelectSubcategory(sub.id)}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-accent transition-colors text-left"
                >
                  <span className="font-semibold tracking-wide">{sub.name}</span>
                  <span className="text-sm text-muted-foreground">{count} peças</span>
                </button>
              );
            })}
          </div>
        ) : (
          <SubcategoryContent
            images={images}
            isLoading={isLoading}
            selectedColor={selectedColor}
            setSelectedColor={setSelectedColor}
            copyUrl={copyUrl}
            deleteMutation={deleteMutation}
            setTransferImageId={setTransferImageId}
            setTransferCategoryId={setTransferCategoryId}
            setTransferSubcategoryId={setTransferSubcategoryId}
          />
        )}

        <UploadDialog
          show={showUpload}
          onClose={() => setShowUpload(false)}
          categoryId={categoryId}
          categoryName={categoryName}
          queryClient={queryClient}
        />
      </div>
    );
  }

  // Subcategory selected — show pieces with color filter
  const subName = subcategories.find((s) => s.id === selectedSubcategoryId)?.name || "";
  const filteredBySubcategory = images.filter((img) => img.subcategory_id === selectedSubcategoryId);

  // Get unique colors
  const colors = Array.from(new Set(filteredBySubcategory.map((img) => img.color).filter(Boolean))) as string[];

  const displayImages = selectedColor
    ? filteredBySubcategory.filter((img) => img.color === selectedColor)
    : filteredBySubcategory;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => { onSelectSubcategory(null); setSelectedColor(null); }}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">{categoryName}</p>
            <h2 className="text-2xl font-bold tracking-tight">{subName}</h2>
          </div>
        </div>
        <Button onClick={() => setShowUpload(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Adicionar Peça
        </Button>
      </div>

      {/* Color filter buttons */}
      {colors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedColor === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedColor(null)}
          >
            Todas
          </Button>
          {colors.map((color) => (
            <Button
              key={color}
              variant={selectedColor === color ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedColor(color)}
            >
              {color}
            </Button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : displayImages.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg">Nenhuma peça encontrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayImages.map((img) => (
            <ImageCard
              key={img.id}
              img={img}
              copyUrl={copyUrl}
              deleteMutation={deleteMutation}
              setTransferImageId={setTransferImageId}
              setTransferCategoryId={setTransferCategoryId}
              setTransferSubcategoryId={setTransferSubcategoryId}
            />
          ))}
        </div>
      )}

      <UploadDialog
        show={showUpload}
        onClose={() => setShowUpload(false)}
        categoryId={categoryId}
        categoryName={categoryName}
        queryClient={queryClient}
      />

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

// --- Sub-components ---

function SubcategoryContent({
  images,
  isLoading,
  selectedColor,
  setSelectedColor,
  copyUrl,
  deleteMutation,
  setTransferImageId,
  setTransferCategoryId,
  setTransferSubcategoryId,
}: any) {
  const colors = Array.from(new Set(images.map((img: any) => img.color).filter(Boolean))) as string[];
  const displayImages = selectedColor
    ? images.filter((img: any) => img.color === selectedColor)
    : images;

  return (
    <>
      {colors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button variant={selectedColor === null ? "default" : "outline"} size="sm" onClick={() => setSelectedColor(null)}>
            Todas
          </Button>
          {colors.map((color: string) => (
            <Button key={color} variant={selectedColor === color ? "default" : "outline"} size="sm" onClick={() => setSelectedColor(color)}>
              {color}
            </Button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : displayImages.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg">Nenhuma peça cadastrada</p>
          <p className="text-sm mt-1">Clique em "Adicionar Peça" para começar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayImages.map((img: any) => (
            <ImageCard
              key={img.id}
              img={img}
              copyUrl={copyUrl}
              deleteMutation={deleteMutation}
              setTransferImageId={setTransferImageId}
              setTransferCategoryId={setTransferCategoryId}
              setTransferSubcategoryId={setTransferSubcategoryId}
            />
          ))}
        </div>
      )}
    </>
  );
}

function ImageCard({ img, copyUrl, deleteMutation, setTransferImageId, setTransferCategoryId, setTransferSubcategoryId }: any) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden group hover:shadow-md transition-shadow">
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
  );
}

function UploadDialog({ show, onClose, categoryId, categoryName, queryClient }: any) {
  return (
    <Dialog open={show} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Peça — {categoryName}</DialogTitle>
        </DialogHeader>
        <ImageUploadForm
          defaultCategoryId={categoryId}
          onSuccess={() => {
            onClose();
            queryClient.invalidateQueries({ queryKey: ["images-category", categoryId] });
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
