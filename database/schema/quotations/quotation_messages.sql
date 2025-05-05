CREATE TABLE IF NOT EXISTS public.quotation_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id UUID NOT NULL,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  is_from_customer BOOLEAN NOT NULL DEFAULT FALSE,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_quotation FOREIGN KEY (quotation_id) REFERENCES public.quotations(id) ON DELETE CASCADE,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Update timestamps trigger
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.quotation_messages
FOR EACH ROW
EXECUTE PROCEDURE public.set_updated_at();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_quotation_messages_quotation_id ON public.quotation_messages(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_messages_user_id ON public.quotation_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_quotation_messages_created_at ON public.quotation_messages(created_at);

-- Add RLS policies
ALTER TABLE public.quotation_messages ENABLE ROW LEVEL SECURITY;

-- RLS policy: Users can see messages related to quotations they have access to
CREATE POLICY quotation_messages_select_policy ON public.quotation_messages
FOR SELECT
USING (
  (user_id = auth.uid()) OR  
  (quotation_id IN (
    SELECT id FROM public.quotations 
    WHERE user_id = auth.uid() OR customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  ))
);

-- RLS policy: Users can insert their own messages
CREATE POLICY quotation_messages_insert_policy ON public.quotation_messages
FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND  -- User is creating their own message
  (quotation_id IN (
    SELECT id FROM public.quotations 
    WHERE user_id = auth.uid() OR customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  ))
);

-- RLS policy: Users can update messages they created
CREATE POLICY quotation_messages_update_policy ON public.quotation_messages
FOR UPDATE
USING (user_id = auth.uid())  -- Only the creator can update
WITH CHECK (user_id = auth.uid() AND is_from_customer = false);  -- Prevent changing is_from_customer flag

-- RLS policy: Users can delete messages they created
CREATE POLICY quotation_messages_delete_policy ON public.quotation_messages
FOR DELETE
USING (user_id = auth.uid());

-- Create comment
COMMENT ON TABLE public.quotation_messages IS 'Stores messages exchanged regarding quotations'; 