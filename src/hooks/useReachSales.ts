import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ReachSalesReport {
  id: string;
  report_date: string;
  retail_member_name: string;
  file_name: string | null;
  total_items_sold: number | null;
  total_sales_value: number | null;
  uploaded_at: string;
}

export interface UploadReachSalesInput {
  report_date: string;
  retail_member_name: string;
  file_name?: string;
  items: {
    item_id: string;
    qty_sold: number;
    unit_price?: number;
    department?: string;
  }[];
}

export function useReachSalesReports() {
  return useQuery({
    queryKey: ['reach_sales_reports'],
    staleTime: Infinity,
    queryFn: async () => {
      // Table not provisioned in this environment — return empty gracefully.
      return [] as ReachSalesReport[];
    },
  });
}


export function useUploadReachSales() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_input: UploadReachSalesInput) => {
      throw new Error('Reach sales upload is not available in this environment.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reach_sales_reports'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Unavailable', description: error.message, variant: 'destructive' });
    },
  });
}

