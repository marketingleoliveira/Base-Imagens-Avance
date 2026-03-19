import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Copy, Trash2, Search, ExternalLink } from "lucide-react";
import { fetchImages, deleteImage } from "@/lib/supabase-helpers";

export function ImageGallery() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: images = [], isLoading } = useQuery({
    queryKey: ["images"],
    queryFn: fetchImages,
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, filePath }: { id: string; filePath: string }) => deleteImage(id, filePath),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["images"] });
      toast.success("Imagem removida!");
    },
    onError: () => toast.error("Erro ao remover imagem"),
  });

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copiada!");
  };

  const filtered = images.filter((img) => {
    const term = search.toLowerCase();
    return (
      img.file_name.toLowerCase().includes(term) ||
      img.color?.toLowerCase().includes(term) ||
      img.size?.toLowerCase().includes(term) ||
      (img.categories as any)?.name?.toLowerCase().includes(term) ||
      (img.subcategories as any)?.name?.toLowerCase().includes(term)
    );
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-80 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, cor, tamanho, categoria..."
          className="pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg">Nenhuma imagem encontrada</p>
          <p className="text-sm mt-1">Faça o upload da primeira imagem na aba "Upload"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((img) => (
            <div key={img.id} className="bg-card border border-border rounded-lg overflow-hidden group hover:shadow-lg transition-shadow">
              <div className="aspect-square overflow-hidden bg-muted">
                <img
                  src={img.public_url}
                  alt={img.file_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm truncate">{img.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(img.categories as any)?.name}
                      {(img.subcategories as any)?.name && ` → ${(img.subcategories as any).name}`}
                    </p>
                  </div>
                </div>

                {/* Metadata tags */}
                <div className="flex flex-wrap gap-1.5">
                  {img.color && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                      {img.color}
                    </span>
                  )}
                  {img.size && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
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
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 font-medium">URL da Imagem</p>
                  <div className="flex items-center gap-1">
                    <code className="text-xs flex-1 truncate text-foreground">{img.public_url}</code>
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

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => deleteMutation.mutate({ id: img.id, filePath: img.file_path })}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Remover
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
