import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { CategorySidebar } from "@/components/CategorySidebar";
import { CategoryView } from "@/components/CategoryView";
import { useQuery } from "@tanstack/react-query";
import { fetchCategories } from "@/lib/supabase-helpers";

const Index = () => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <CategorySidebar
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={(catId) => {
            setSelectedCategoryId(catId);
            setSelectedSubcategoryId(null);
          }}
        />

        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b border-border px-4 gap-4">
            <SidebarTrigger />
            <h1 className="text-lg font-bold tracking-tight">Gerenciador de Peças</h1>
          </header>

          <main className="flex-1">
            {selectedCategoryId && selectedCategory ? (
              <CategoryView
                categoryId={selectedCategoryId}
                categoryName={selectedCategory.name}
                selectedSubcategoryId={selectedSubcategoryId}
                onSelectSubcategory={setSelectedSubcategoryId}
                onCategoryDeleted={() => {
                  setSelectedCategoryId(null);
                  setSelectedSubcategoryId(null);
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <p className="text-xl font-medium">Selecione uma categoria</p>
                  <p className="text-sm mt-1">Use o menu lateral para navegar</p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
