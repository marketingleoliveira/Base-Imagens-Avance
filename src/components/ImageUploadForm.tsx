import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload, Plus, ImageIcon } from "lucide-react";
import {
  fetchCategories,
  fetchSubcategories,
  uploadImage,
  saveImageRecord,
  addCategory,
  addSubcategory,
} from "@/lib/supabase-helpers";

export function ImageUploadForm({ onSuccess }: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [composition, setComposition] = useState("");
  const [measurements, setMeasurements] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newSubcategory, setNewSubcategory] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [showNewSubcategory, setShowNewSubcategory] = useState(false);
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

  const addCategoryMutation = useMutation({
    mutationFn: (name: string) => addCategory(name),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setCategoryId(data.id);
      setNewCategory("");
      setShowNewCategory(false);
      toast.success("Categoria adicionada!");
    },
    onError: () => toast.error("Erro ao adicionar categoria"),
  });

  const addSubcategoryMutation = useMutation({
    mutationFn: (name: string) => addSubcategory(categoryId, name),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["subcategories", categoryId] });
      setSubcategoryId(data.id);
      setNewSubcategory("");
      setShowNewSubcategory(false);
      toast.success("Subcategoria adicionada!");
    },
    onError: () => toast.error("Erro ao adicionar subcategoria"),
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
      });
      toast.success("Imagem enviada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["images"] });
      // Reset
      setFile(null);
      setPreview(null);
      setCategoryId("");
      setSubcategoryId("");
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Upload area */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Imagem</Label>
        <label
          className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-accent transition-colors bg-muted/30"
        >
          {preview ? (
            <img src={preview} alt="Preview" className="h-full w-full object-contain rounded-lg" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <ImageIcon className="w-10 h-10" />
              <span className="text-sm">Clique para selecionar uma imagem</span>
            </div>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </label>
      </div>

      {/* Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Categoria</Label>
          {showNewCategory ? (
            <div className="flex gap-2">
              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Nova categoria"
              />
              <Button
                type="button"
                size="sm"
                onClick={() => newCategory && addCategoryMutation.mutate(newCategory)}
              >
                <Plus className="w-4 h-4" />
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowNewCategory(false)}>
                ✕
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); setSubcategoryId(""); }}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" size="icon" onClick={() => setShowNewCategory(true)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Subcategoria</Label>
          {showNewSubcategory ? (
            <div className="flex gap-2">
              <Input
                value={newSubcategory}
                onChange={(e) => setNewSubcategory(e.target.value)}
                placeholder="Nova subcategoria"
              />
              <Button
                type="button"
                size="sm"
                onClick={() => newSubcategory && addSubcategoryMutation.mutate(newSubcategory)}
              >
                <Plus className="w-4 h-4" />
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowNewSubcategory(false)}>
                ✕
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Select value={subcategoryId} onValueChange={setSubcategoryId} disabled={!categoryId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {subcategories.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" size="icon" onClick={() => setShowNewSubcategory(true)} disabled={!categoryId}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Cor</Label>
          <Input value={color} onChange={(e) => setColor(e.target.value)} placeholder="Ex: Preto, Branco" />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Tamanho</Label>
          <Input value={size} onChange={(e) => setSize(e.target.value)} placeholder="Ex: P, M, G, GG" />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Composição</Label>
        <Input value={composition} onChange={(e) => setComposition(e.target.value)} placeholder="Ex: 100% Algodão" />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Medidas da Peça</Label>
        <Textarea
          value={measurements}
          onChange={(e) => setMeasurements(e.target.value)}
          placeholder="Ex: Busto: 90cm, Cintura: 70cm, Comprimento: 60cm"
          rows={3}
        />
      </div>

      <Button type="submit" disabled={uploading || !file} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
        {uploading ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin w-4 h-4 border-2 border-accent-foreground border-t-transparent rounded-full" />
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
