import { useQuery } from "@tanstack/react-query";
import { fetchCategories } from "@/lib/supabase-helpers";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

interface CategorySidebarProps {
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string) => void;
}

export function CategorySidebar({
  selectedCategoryId,
  onSelectCategory,
}: CategorySidebarProps) {
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-widest text-sidebar-foreground/50 px-4 py-3">
            Categorias
          </SidebarGroupLabel>
          <SidebarMenu>
            {categories.map((cat) => (
              <SidebarMenuItem key={cat.id}>
                <SidebarMenuButton
                  onClick={() => onSelectCategory(cat.id)}
                  isActive={selectedCategoryId === cat.id}
                  className="font-medium tracking-wide"
                >
                  <span>{cat.name}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
