import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FolderUp, Loader2 } from "lucide-react";
import { createGallery, uploadImage, saveImageRecord } from "@/lib/supabase-helpers";

interface FolderUploadProps {
  categoryId: string;
  subcategoryId?: string | null;
  onSuccess?: () => void;
  compact?: boolean;
}

interface FolderGroup {
  folderName: string;
  files: File[];
}

function parseFolderGroups(files: File[], relativePaths?: string[]): FolderGroup[] {
  const groups: Record<string, File[]> = {};

  files.forEach((file, i) => {
    if (!file.type.startsWith("image/")) return;

    const path = relativePaths?.[i] || file.webkitRelativePath || file.name;
    const parts = path.split("/");
    const folderName = parts.length > 2 ? parts[1] : parts[0];

    if (!groups[folderName]) groups[folderName] = [];
    groups[folderName].push(file);
  });

  return Object.entries(groups).map(([folderName, files]) => ({ folderName, files }));
}

async function getFilesFromDataTransfer(dataTransfer: DataTransfer): Promise<{ files: File[]; paths: string[] }> {
  const files: File[] = [];
  const paths: string[] = [];

  const items = Array.from(dataTransfer.items);
  const entries = items
    .map((item) => item.webkitGetAsEntry?.())
    .filter(Boolean) as FileSystemEntry[];

  async function readEntry(entry: FileSystemEntry, path: string) {
    if (entry.isFile) {
      const file = await new Promise<File>((resolve) =>
        (entry as FileSystemFileEntry).file(resolve)
      );
      files.push(file);
      paths.push(path + entry.name);
    } else if (entry.isDirectory) {
      const dirReader = (entry as FileSystemDirectoryEntry).createReader();
      const subEntries = await new Promise<FileSystemEntry[]>((resolve) =>
        dirReader.readEntries(resolve)
      );
      for (const sub of subEntries) {
        await readEntry(sub, path + entry.name + "/");
      }
    }
  }

  for (const entry of entries) {
    await readEntry(entry, "");
  }

  return { files, paths };
}

export function FolderUpload({ categoryId, subcategoryId, onSuccess, compact }: FolderUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, folder: "" });
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processUpload = useCallback(async (folders: FolderGroup[]) => {
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

        const gallery = await createGallery({
          name: folder.folderName,
          category_id: categoryId,
          subcategory_id: subcategoryId || null,
          color: folder.folderName,
        });

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

      toast.success(`${folders.length} galeria(s) criada(s) com ${totalImages} imagem(ns)!`);
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao processar pastas.");
    } finally {
      setUploading(false);
      setProgress({ current: 0, total: 0, folder: "" });
      if (inputRef.current) inputRef.current.value = "";
    }
  }, [categoryId, subcategoryId, onSuccess]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;
    const folders = parseFolderGroups(Array.from(fileList));
    processUpload(folders);
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const { files, paths } = await getFilesFromDataTransfer(e.dataTransfer);
    const folders = parseFolderGroups(files, paths);
    processUpload(folders);
  }, [processUpload]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        // @ts-ignore
        webkitdirectory=""
        directory=""
        multiple
        className="hidden"
        onChange={handleFileInput}
      />

      {uploading ? (
        <div className="flex items-center gap-3 bg-muted/50 border border-border rounded-lg px-4 py-3">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <div className="text-sm">
            <p className="font-medium">Enviando: {progress.folder}</p>
            <p className="text-muted-foreground text-xs">
              {progress.current}/{progress.total} imagens
            </p>
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`
            cursor-pointer border-2 border-dashed rounded-lg transition-colors
            flex items-center justify-center gap-2 text-sm
            ${compact ? "px-3 py-2" : "px-4 py-6"}
            ${isDragging
              ? "border-primary bg-primary/5 text-primary"
              : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            }
          `}
        >
          <FolderUp className="w-4 h-4" />
          <span>{compact ? "Upload Pasta" : "Arraste pastas aqui ou clique para selecionar"}</span>
        </div>
      )}
    </div>
  );
}
