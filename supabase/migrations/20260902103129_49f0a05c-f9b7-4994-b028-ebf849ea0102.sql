CREATE TABLE public.push_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL UNIQUE,
  token TEXT NOT NULL,
  tz_offset INTEGER NOT NULL DEFAULT 0,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  ongoing_enabled BOOLEAN NOT NULL DEFAULT true,
  last_ongoing TEXT,
  sent_keys TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT ALL ON public.push_devices TO service_role;

ALTER TABLE public.push_devices ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER push_devices_updated_at
BEFORE UPDATE ON public.push_devices
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();