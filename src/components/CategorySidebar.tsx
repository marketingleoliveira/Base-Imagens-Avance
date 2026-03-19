import { useQuery } from "@tanstack/react-query";
import { fetchCategories, fetchAllSubcategories } from "@/lib/supabase-helpers";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";

interface CategorySidebarProps {
  selectedCategoryId: string | null;
  selectedSubcategoryId: string | null;
  onSelectCategory: (categoryId: string) => void;
  onSelectSubcategory: (categoryId: string, subcategoryId: string | null) => void;
}

export function CategorySidebar({
  selectedCategoryId,
  selectedSubcategoryId,
  onSelectCategory,
  onSelectSubcategory,
}: CategorySidebarProps) {
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const { data: allSubcategories = [] } = useQuery({
    queryKey: ["all-subcategories"],
    queryFn: fetchAllSubcategories,
  });

  const getSubcategories = (catId: string) =>
    allSubcategories.filter((s) => s.category_id === catId);

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-widest text-sidebar-foreground/50 px-4 py-3">
            Categorias
          </SidebarGroupLabel>
          <SidebarMenu>
            {categories.map((cat) => {
              const subs = getSubcategories(cat.id);
              const isActive = selectedCategoryId === cat.id;

              if (subs.length === 0) {
                return (
                  <SidebarMenuItem key={cat.id}>
                    <SidebarMenuButton
                      onClick={() => {
                        onSelectCategory(cat.id);
                        onSelectSubcategory(cat.id, null);
                      }}
                      isActive={isActive && !selectedSubcategoryId}
                      className="font-medium tracking-wide"
                    >
                      <span>{cat.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              }

              return (
                <Collapsible key={cat.id} defaultOpen={isActive}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        onClick={() => {
                          onSelectCategory(cat.id);
                          onSelectSubcategory(cat.id, null);
                        }}
                        isActive={isActive && !selectedSubcategoryId}
                        className="font-medium tracking-wide"
                      >
                        <span>{cat.name}</span>
                        <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            onClick={() => onSelectSubcategory(cat.id, null)}
                            isActive={isActive && !selectedSubcategoryId}
                            className="text-xs"
                          >
                            Todas
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        {subs.map((sub) => (
                          <SidebarMenuSubItem key={sub.id}>
                            <SidebarMenuSubButton
                              onClick={() => onSelectSubcategory(cat.id, sub.id)}
                              isActive={isActive && selectedSubcategoryId === sub.id}
                              className="text-xs"
                            >
                              {sub.name}
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
