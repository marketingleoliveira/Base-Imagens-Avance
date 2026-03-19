import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUploadForm } from "@/components/ImageUploadForm";
import { ImageGallery } from "@/components/ImageGallery";
import { Upload, Images } from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState("gallery");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Gerenciador de Imagens
          </h1>
          <p className="text-muted-foreground mt-1">
            Faça upload, organize e gere URLs das imagens dos seus produtos.
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-6xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="gallery" className="flex items-center gap-2">
              <Images className="w-4 h-4" />
              Galeria
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gallery">
            <ImageGallery />
          </TabsContent>

          <TabsContent value="upload">
            <div className="max-w-2xl mx-auto">
              <div className="bg-card border border-border rounded-lg p-6 md:p-8">
                <h2 className="text-xl font-semibold mb-6">Nova Imagem</h2>
                <ImageUploadForm onSuccess={() => setActiveTab("gallery")} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
