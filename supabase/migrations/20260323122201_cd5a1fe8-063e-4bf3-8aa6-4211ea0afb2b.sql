
-- Create galleries table for grouping images
CREATE TABLE public.galleries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add gallery_id to images table
ALTER TABLE public.images ADD COLUMN gallery_id UUID REFERENCES public.galleries(id) ON DELETE SET NULL;

-- Enable RLS on galleries
ALTER TABLE public.galleries ENABLE ROW LEVEL SECURITY;

-- RLS policies for galleries
CREATE POLICY "Anyone can read galleries" ON public.galleries FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert galleries" ON public.galleries FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update galleries" ON public.galleries FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete galleries" ON public.galleries FOR DELETE TO public USING (true);

-- Add delete policies for categories and subcategories
CREATE POLICY "Anyone can delete categories" ON public.categories FOR DELETE TO public USING (true);
CREATE POLICY "Anyone can update categories" ON public.categories FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete subcategories" ON public.subcategories FOR DELETE TO public USING (true);
CREATE POLICY "Anyone can update subcategories" ON public.subcategories FOR UPDATE TO public USING (true);

-- Trigger for updated_at on galleries
CREATE TRIGGER update_galleries_updated_at
  BEFORE UPDATE ON public.galleries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
