import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload, ImageIcon } from "lucide-react";
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

export function ImageUploadForm({ defaultCategoryId, defaultSubcategoryId, defaultGalleryId, onSuccess }: ImageUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState(defaultCategoryId || "");
  const [subcategoryId, setSubcategoryId] = useState(defaultSubcategoryId || "");
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [composition, setComposition] = useState("");
  const [measurements, setMeasurements] = useState("");
  const [uploading, setUploading] = useState(false);

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
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(selected);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !categoryId) {
      toast.error("Selecione uma imagem e uma categoria.");
      return;
    }

    setUploading(true);
    try {
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
      toast.success("Imagem enviada com sucesso!");
      setFile(null);
      setPreview(null);
      setColor("");
      setSize("");
      setComposition("");
      setMeasurements("");
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao enviar imagem.");
    } finally {
      setUploading(false);
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
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Imagem</Label>
        <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-foreground/30 transition-colors bg-muted/30">
          {preview ? (
            <img src={preview} alt="Preview" className="h-full w-full object-contain rounded-lg" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <ImageIcon className="w-8 h-8" />
              <span className="text-sm">Clique para selecionar</span>
            </div>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </label>
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

      <Button type="submit" disabled={uploading || !file} className="w-full">
        {uploading ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
            Enviando...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Enviar Imagem
          </span>
        )}
      </Button>
    </form>
  );
}
