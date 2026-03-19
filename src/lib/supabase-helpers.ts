import { supabase } from "@/integrations/supabase/client";

export async function fetchCategories() {
  const { data, error } = await supabase.from("categories").select("*").order("name");
  if (error) throw error;
  return data;
}

export async function fetchSubcategories(categoryId: string) {
  const { data, error } = await supabase
    .from("subcategories")
    .select("*")
    .eq("category_id", categoryId)
    .order("name");
  if (error) throw error;
  return data;
}

export async function fetchAllSubcategories() {
  const { data, error } = await supabase.from("subcategories").select("*").order("name");
  if (error) throw error;
  return data;
}

export async function fetchImages() {
  const { data, error } = await supabase
    .from("images")
    .select("*, categories(name), subcategories(name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchImagesByCategory(categoryId: string) {
  const { data, error } = await supabase
    .from("images")
    .select("*, categories(name), subcategories(name)")
    .eq("category_id", categoryId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function uploadImage(file: File) {
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `uploads/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from("product-images")
    .getPublicUrl(filePath);

  return { filePath, publicUrl: urlData.publicUrl, fileName: file.name };
}

export async function saveImageRecord(record: {
  file_name: string;
  file_path: string;
  public_url: string;
  category_id: string;
  subcategory_id?: string | null;
  color?: string;
  size?: string;
  composition?: string;
  measurements?: string;
}) {
  const { data, error } = await supabase.from("images").insert(record).select().single();
  if (error) throw error;
  return data;
}

export async function deleteImage(id: string, filePath: string) {
  await supabase.storage.from("product-images").remove([filePath]);
  const { error } = await supabase.from("images").delete().eq("id", id);
  if (error) throw error;
}

export async function updateImageCategory(imageId: string, categoryId: string, subcategoryId: string | null) {
  const { error } = await supabase
    .from("images")
    .update({ category_id: categoryId, subcategory_id: subcategoryId })
    .eq("id", imageId);
  if (error) throw error;
}

export async function addCategory(name: string) {
  const { data, error } = await supabase.from("categories").insert({ name }).select().single();
  if (error) throw error;
  return data;
}

export async function addSubcategory(categoryId: string, name: string) {
  const { data, error } = await supabase
    .from("subcategories")
    .insert({ category_id: categoryId, name })
    .select()
    .single();
  if (error) throw error;
  return data;
}
