import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FolderUp, Loader2, CheckCircle2 } from "lucide-react";
import { createGallery, uploadImage, saveImageRecord } from "@/lib/supabase-helpers";

interface FolderUploadProps {
  categoryId: string;
  subcategoryId?: string | null;
  onSuccess?: () => void;
}

interface FolderGroup {
  folderName: string;
  files: File[];
}

export function FolderUpload({ categoryId, subcategoryId, onSuccess }: FolderUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, folder: "" });
  const inputRef = useRef<HTMLInputElement>(null);

  const parseFolders = (fileList: FileList): FolderGroup[] => {
    const groups: Record<string, File[]> = {};

    Array.from(fileList).forEach((file) => {
      // Only accept image files
      if (!file.type.startsWith("image/")) return;

      const parts = file.webkitRelativePath.split("/");
      // parts[0] is the root folder selected, subfolders start at parts[1]
      // If structure is: RootFolder/SubFolder/image.jpg → use SubFolder
      // If structure is: RootFolder/image.jpg → use RootFolder
      const folderName = parts.length > 2 ? parts[1] : parts[0];

      if (!groups[folderName]) {
        groups[folderName] = [];
      }
      groups[folderName].push(file);
    });

    return Object.entries(groups).map(([folderName, files]) => ({ folderName, files }));
  };

  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const folders = parseFolders(fileList);
    if (folders.length === 0) {
      toast.error("Nenhuma imagem encontrada nas pastas selecionadas.");
      return;
    }

    const totalImages = folders.reduce((sum, f) => sum + f.files.length, 0);

    setUploading(true);
    setProgress({ current: 0, total: totalImages, folder: "" });

    let uploaded = 0;

    try {
      for (const folder of folders) {
        setProgress((p) => ({ ...p, folder: folder.folderName }));

        // Create a gallery with the folder name as gallery name and color
        const gallery = await createGallery({
          name: folder.folderName,
          category_id: categoryId,
          subcategory_id: subcategoryId || null,
          color: folder.folderName,
        });

        // Upload each image in the folder
        for (const file of folder.files) {
          const { filePath, publicUrl, fileName } = await uploadImage(file);
          await saveImageRecord({
            file_name: fileName,
            file_path: filePath,
            public_url: publicUrl,
            category_id: categoryId,
            subcategory_id: subcategoryId || null,
            gallery_id: gallery.id,
          });
          uploaded++;
          setProgress((p) => ({ ...p, current: uploaded }));
        }
      }

      toast.success(
        `${folders.length} galeria(s) criada(s) com ${totalImages} imagem(ns) enviada(s)!`
      );
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao processar pastas.");
    } finally {
      setUploading(false);
      setProgress({ current: 0, total: 0, folder: "" });
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        // @ts-ignore - webkitdirectory is not in standard types
        webkitdirectory=""
        directory=""
        multiple
        className="hidden"
        onChange={handleFolderSelect}
      />

      {uploading ? (
        <div className="flex items-center gap-3 bg-muted/50 border border-border rounded-lg px-4 py-3">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <div className="text-sm">
            <p className="font-medium">Enviando pasta: {progress.folder}</p>
            <p className="text-muted-foreground text-xs">
              {progress.current}/{progress.total} imagens
            </p>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => inputRef.current?.click()}
        >
          <FolderUp className="w-4 h-4" /> Upload de Pasta
        </Button>
      )}
    </div>
  );
}
