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
  gallery_id?: string | null;
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

export async function deleteCategory(id: string) {
  // Delete all images in this category from storage first
  const { data: images } = await supabase.from("images").select("file_path").eq("category_id", id);
  if (images && images.length > 0) {
    await supabase.storage.from("product-images").remove(images.map((i) => i.file_path));
  }
  // Delete galleries
  await supabase.from("galleries").delete().eq("category_id", id);
  // Delete images records
  await supabase.from("images").delete().eq("category_id", id);
  // Delete subcategories
  await supabase.from("subcategories").delete().eq("category_id", id);
  // Delete category
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
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

export async function deleteSubcategory(id: string) {
  const { data: images } = await supabase.from("images").select("file_path").eq("subcategory_id", id);
  if (images && images.length > 0) {
    await supabase.storage.from("product-images").remove(images.map((i) => i.file_path));
  }
  await supabase.from("galleries").delete().eq("subcategory_id", id);
  await supabase.from("images").delete().eq("subcategory_id", id);
  const { error } = await supabase.from("subcategories").delete().eq("id", id);
  if (error) throw error;
}

// Gallery helpers
export async function fetchGalleries(categoryId: string, subcategoryId?: string | null) {
  let query = supabase
    .from("galleries")
    .select("*")
    .eq("category_id", categoryId)
    .order("created_at", { ascending: false });

  if (subcategoryId) {
    query = query.eq("subcategory_id", subcategoryId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createGallery(record: {
  name: string;
  category_id: string;
  subcategory_id?: string | null;
  color?: string | null;
}) {
  const { data, error } = await supabase.from("galleries").insert(record).select().single();
  if (error) throw error;
  return data;
}

export async function deleteGallery(id: string) {
  // Delete images in gallery from storage
  const { data: images } = await supabase.from("images").select("file_path").eq("gallery_id", id);
  if (images && images.length > 0) {
    await supabase.storage.from("product-images").remove(images.map((i) => i.file_path));
  }
  await supabase.from("images").delete().eq("gallery_id", id);
  const { error } = await supabase.from("galleries").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchImagesByGallery(galleryId: string) {
  const { data, error } = await supabase
    .from("images")
    .select("*")
    .eq("gallery_id", galleryId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function updateGallery(id: string, updates: { name?: string; color?: string | null }) {
  const { error } = await supabase.from("galleries").update(updates).eq("id", id);
  if (error) throw error;
}

export async function updateCategory(id: string, name: string) {
  const { error } = await supabase.from("categories").update({ name }).eq("id", id);
  if (error) throw error;
}

export async function updateSubcategory(id: string, name: string) {
  const { error } = await supabase.from("subcategories").update({ name }).eq("id", id);
  if (error) throw error;
}

export async function fetchAllGalleries() {
  const { data, error } = await supabase
    .from("galleries")
    .select("*, categories(name), subcategories(name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function countImagesByCategory(categoryId: string) {
  const { count, error } = await supabase
    .from("images")
    .select("*", { count: "exact", head: true })
    .eq("category_id", categoryId);
  if (error) throw error;
  return count || 0;
}

export async function countImagesByGallery(galleryId: string) {
  const { count, error } = await supabase
    .from("images")
    .select("*", { count: "exact", head: true })
    .eq("gallery_id", galleryId);
  if (error) throw error;
  return count || 0;
}
