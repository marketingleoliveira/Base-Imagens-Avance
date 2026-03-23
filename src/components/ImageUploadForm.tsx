import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload, ImageIcon, X } from "lucide-react";
import {
  fetchCategories,
  fetchSubcategories,
  uploadImage,
  saveImageRecord,
} from "@/lib/supabase-helpers";

interface ImageUploadFormProps {
  defaultCategoryId?: string;
  defaultSubcategoryId?: string | null;
  defaultGalleryId?: string | null;
  onSuccess?: () => void;
}

interface FilePreview {
  file: File;
  preview: string;
}

export function ImageUploadForm({ defaultCategoryId, defaultSubcategoryId, defaultGalleryId, onSuccess }: ImageUploadFormProps) {
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [categoryId, setCategoryId] = useState(defaultCategoryId || "");
  const [subcategoryId, setSubcategoryId] = useState(defaultSubcategoryId || "");
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [composition, setComposition] = useState("");
  const [measurements, setMeasurements] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const { data: subcategories = [] } = useQuery({
    queryKey: ["subcategories", categoryId],
    queryFn: () => fetchSubcategories(categoryId),
    enabled: !!categoryId,
  });

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;

    const newFiles: FilePreview[] = [];
    Array.from(selected).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        newFiles.push({ file, preview: reader.result as string });
        if (newFiles.length === selected.length) {
          setFiles((prev) => [...prev, ...newFiles]);
        }
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0 || !categoryId) {
      toast.error("Selecione ao menos uma imagem e uma categoria.");
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const { file } = files[i];
        const { filePath, publicUrl, fileName } = await uploadImage(file);
        await saveImageRecord({
          file_name: fileName,
          file_path: filePath,
          public_url: publicUrl,
          category_id: categoryId,
          subcategory_id: subcategoryId || null,
          color: color || undefined,
          size: size || undefined,
          composition: composition || undefined,
          measurements: measurements || undefined,
          gallery_id: defaultGalleryId || null,
        });
        setProgress(i + 1);
      }
      toast.success(`${files.length} imagem(ns) enviada(s) com sucesso!`);
      setFiles([]);
      setColor("");
      setSize("");
      setComposition("");
      setMeasurements("");
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao enviar imagens.");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const sizeOptions = ["P", "M", "G", "G1", "G2"];
  const sizeRanges = [
    "P ao M", "P ao G", "P ao G1", "P ao G2",
    "M ao G", "M ao G1", "M ao G2",
    "G ao G1", "G ao G2",
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Imagens {files.length > 0 && `(${files.length} selecionada${files.length > 1 ? "s" : ""})`}
        </Label>
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-foreground/30 transition-colors bg-muted/30">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <ImageIcon className="w-8 h-8" />
            <span className="text-sm">Clique para selecionar imagens</span>
          </div>
          <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
        </label>

        {files.length > 0 && (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-2">
            {files.map((fp, i) => (
              <div key={i} className="relative group aspect-square rounded-md overflow-hidden border border-border">
                <img src={fp.preview} alt={fp.file.name} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {!defaultCategoryId && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Categoria</Label>
            <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); setSubcategoryId(""); }}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Subcategoria</Label>
            <Select value={subcategoryId} onValueChange={setSubcategoryId} disabled={!categoryId || subcategories.length === 0}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {subcategories.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {defaultCategoryId && !defaultSubcategoryId && subcategories.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Subcategoria</Label>
          <Select value={subcategoryId} onValueChange={setSubcategoryId}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {subcategories.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cor</Label>
        <Input value={color} onChange={(e) => setColor(e.target.value)} placeholder="Ex: Preto, Branco" />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tamanho</Label>
        <Select value={size} onValueChange={setSize}>
          <SelectTrigger><SelectValue placeholder="Selecione o tamanho" /></SelectTrigger>
          <SelectContent>
            {sizeOptions.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Faixas</div>
            {sizeRanges.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Composição</Label>
        <Input value={composition} onChange={(e) => setComposition(e.target.value)} placeholder="Ex: 100% Algodão" />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Medidas da Peça</Label>
        <Textarea
          value={measurements}
          onChange={(e) => setMeasurements(e.target.value)}
          placeholder="Ex: Busto: 90cm, Cintura: 70cm"
          rows={3}
        />
      </div>

      <Button type="submit" disabled={uploading || files.length === 0} className="w-full">
        {uploading ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
            Enviando {progress}/{files.length}...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Enviar {files.length > 1 ? `${files.length} Imagens` : "Imagem"}
          </span>
        )}
      </Button>
    </form>
  );
}
