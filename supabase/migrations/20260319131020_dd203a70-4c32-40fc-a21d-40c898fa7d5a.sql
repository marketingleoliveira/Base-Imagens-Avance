
-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subcategories table
CREATE TABLE public.subcategories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(category_id, name)
);

-- Create images table
CREATE TABLE public.images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES public.categories(id),
  subcategory_id UUID REFERENCES public.subcategories(id),
  color TEXT,
  size TEXT,
  composition TEXT,
  measurements TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

-- Public read/write access
CREATE POLICY "Anyone can read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Anyone can insert categories" ON public.categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read subcategories" ON public.subcategories FOR SELECT USING (true);
CREATE POLICY "Anyone can insert subcategories" ON public.subcategories FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read images" ON public.images FOR SELECT USING (true);
CREATE POLICY "Anyone can insert images" ON public.images FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update images" ON public.images FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete images" ON public.images FOR DELETE USING (true);

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

CREATE POLICY "Anyone can view product images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Anyone can upload product images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "Anyone can delete product images" ON storage.objects FOR DELETE USING (bucket_id = 'product-images');

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_images_updated_at
BEFORE UPDATE ON public.images
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed categories
INSERT INTO public.categories (name) VALUES 
  ('Camisetas'), ('Calças'), ('Vestidos'), ('Saias'), ('Jaquetas'), ('Acessórios'), ('Calçados'), ('Moda Íntima');

-- Seed subcategories
INSERT INTO public.subcategories (category_id, name)
SELECT c.id, s.name FROM public.categories c
CROSS JOIN (VALUES ('Manga Curta'), ('Manga Longa'), ('Regata'), ('Polo')) AS s(name)
WHERE c.name = 'Camisetas';

INSERT INTO public.subcategories (category_id, name)
SELECT c.id, s.name FROM public.categories c
CROSS JOIN (VALUES ('Jeans'), ('Social'), ('Legging'), ('Moletom')) AS s(name)
WHERE c.name = 'Calças';

INSERT INTO public.subcategories (category_id, name)
SELECT c.id, s.name FROM public.categories c
CROSS JOIN (VALUES ('Longo'), ('Curto'), ('Midi'), ('Festa')) AS s(name)
WHERE c.name = 'Vestidos';
