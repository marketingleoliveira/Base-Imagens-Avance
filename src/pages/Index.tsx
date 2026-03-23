import { useState } from "react";
import { Link } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { CategorySidebar } from "@/components/CategorySidebar";
import { CategoryView } from "@/components/CategoryView";
import { useQuery } from "@tanstack/react-query";
import { fetchCategories } from "@/lib/supabase-helpers";
import { Button } from "@/components/ui/button";
import { LayoutDashboard } from "lucide-react";
import logoAvance from "@/assets/logo_avance.png";

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
          <header className="h-16 flex items-center border-b border-border px-4 gap-4">
            <SidebarTrigger />
            <div className="flex-1 flex justify-center">
              <img src={logoAvance} alt="Avance" className="h-10 object-contain" />
            </div>
            <div>
              <Link to="/dashboard">
                <Button variant="outline" size="sm" className="gap-2">
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Button>
              </Link>
            </div>
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
                  <img src={logoAvance} alt="Avance" className="h-20 mx-auto mb-4 opacity-30" />
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
