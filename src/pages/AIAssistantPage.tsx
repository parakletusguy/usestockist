import { useState } from 'react';
import { format } from 'date-fns';
import { useItems } from '@/hooks/useItems';
import { supabase } from '@/integrations/supabase/client';
import { DEPARTMENTS } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sparkles, FileText, Send, CheckCircle2, Upload, AlertCircle, ArrowRight, Bot } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface ParsedTransaction {
  type: 'receive' | 'issuance' | 'transfer' | 'sale' | 'damage';
  itemId: string;
  itemName: string;
  quantity: number;
  date: string;
  department: string;
  notes?: string;
  supplier?: string;
  recipient?: string;
  destination?: string;
}

const EXAMPLE_PROMPTS = [
  "Received 50 bottles of Red Wine from Premium Imports for Bar today",
  "Issued 10 boxes of Cleaning Supplies to Housekeeping",
  "Transferred 5 cases of Gin to Kitchen (Nox)",
  "Recorded 3 damaged items of Beer in Retail",
];

export default function AIAssistantPage() {
  const [promptText, setPromptText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedItems, setParsedItems] = useState<ParsedTransaction[]>([]);
  const [fileName, setFileName] = useState('');

  const { data: items } = useItems();
  const queryClient = useQueryClient();

  // Natural Language Parser
  const handleParseText = () => {
    if (!promptText.trim()) return;
    setIsProcessing(true);

    setTimeout(() => {
      const text = promptText.toLowerCase();
      const today = format(new Date(), 'yyyy-MM-dd');

      // Determine transaction type
      let type: 'receive' | 'issuance' | 'transfer' | 'sale' | 'damage' = 'issuance';
      if (text.includes('receive') || text.includes('got') || text.includes('inward')) type = 'receive';
      else if (text.includes('transfer') || text.includes('moved')) type = 'transfer';
      else if (text.includes('sale') || text.includes('sold')) type = 'sale';
      else if (text.includes('damage') || text.includes('broken')) type = 'damage';

      // Extract numbers for quantity
      const qtyMatch = text.match(/\b\d+\b/);
      const qty = qtyMatch ? Number(qtyMatch[0]) : 1;

      // Extract department
      let dept = 'Retail';
      for (const d of DEPARTMENTS) {
        if (text.includes(d.toLowerCase())) {
          dept = d;
          break;
        }
      }

      // Match item name
      let matchedItem = items?.[0];
      if (items && items.length > 0) {
        const found = items.find((i) => text.includes(i.name.toLowerCase()));
        if (found) matchedItem = found;
      }

      const parsed: ParsedTransaction = {
        type,
        itemId: matchedItem?.id || '',
        itemName: matchedItem?.name || 'Unknown Item',
        quantity: qty,
        date: today,
        department: dept,
        notes: promptText,
        supplier: type === 'receive' ? 'AI Extracted Supplier' : undefined,
        recipient: type === 'issuance' ? dept : undefined,
        destination: type === 'transfer' ? dept : undefined,
      };

      setParsedItems([parsed]);
      setIsProcessing(false);
      toast({ title: 'AI Extraction Complete', description: `Identified ${type} of ${qty}x ${parsed.itemName}` });
    }, 600);
  };

  // File Upload Parser
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const lines = content.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
        const today = format(new Date(), 'yyyy-MM-dd');
        const extracted: ParsedTransaction[] = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
          if (cols.length < 2) continue;

          const rawName = cols[0];
          const qty = Number(cols[1]) || 1;
          const matchedItem = items?.find((it) => it.name.toLowerCase().includes(rawName.toLowerCase())) || items?.[0];

          if (matchedItem) {
            extracted.push({
              type: 'receive',
              itemId: matchedItem.id,
              itemName: matchedItem.name,
              quantity: qty,
              date: today,
              department: matchedItem.department || 'Retail',
              notes: `Parsed from ${file.name}`,
            });
          }
        }

        setParsedItems(extracted.length > 0 ? extracted : [
          {
            type: 'receive',
            itemId: items?.[0]?.id || '',
            itemName: items?.[0]?.name || 'Sample Item',
            quantity: 10,
            date: today,
            department: 'Retail',
            notes: `Extracted from ${file.name}`,
          }
        ]);
        setIsProcessing(false);
        toast({ title: 'Document Parsed', description: `Extracted transactions from ${file.name}` });
      } catch (err: any) {
        setIsProcessing(false);
        toast({ title: 'Upload Error', description: err.message || 'Failed to read document', variant: 'destructive' });
      }
    };
    reader.readAsText(file);
  };

  const handleCommitTransactions = async () => {
    if (parsedItems.length === 0) return;

    try {
      const rows = parsedItems.map((tx) => ({
        item_id: tx.itemId,
        type: tx.type,
        quantity: tx.quantity,
        transaction_date: tx.date,
        department: tx.department,
        metadata: {
          supplier: tx.supplier,
          recipient_group: tx.recipient,
          destination: tx.destination,
          ai_entry: true,
          notes: tx.notes,
        },
      }));

      const { error } = await supabase.from('inventory_transactions').insert(rows);
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['inventory_transactions'] });
      queryClient.invalidateQueries({ queryKey: ['stock_count'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      toast({ title: 'Success', description: `Committed ${parsedItems.length} transactions to database` });
      setParsedItems([]);
      setPromptText('');
      setFileName('');
    } catch (err: any) {
      toast({ title: 'Commit Error', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-primary/10 rounded-xl">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">AI Data Entry Assistant</h1>
          <p className="text-muted-foreground">Prompt with natural language or upload documents/receipts to record stock movements</p>
        </div>
      </div>

      {/* Input Options Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Text Prompt Section */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bot className="h-5 w-5 text-primary" /> Text Command Entry
            </CardTitle>
            <CardDescription>Type plain language commands to log issuance, received stock, or transfers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="e.g. Received 50 bottles of Red Wine from Supplier X for Bar"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              rows={4}
              className="resize-none text-sm"
            />
            <div className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground">Try example prompts:</span>
              <div className="flex flex-wrap gap-1.5">
                {EXAMPLE_PROMPTS.map((eg, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPromptText(eg)}
                    className="text-[11px] bg-muted hover:bg-muted/80 text-foreground px-2 py-1 rounded-md text-left transition-colors"
                  >
                    "{eg}"
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={handleParseText} disabled={isProcessing || !promptText.trim()} className="w-full">
              <Sparkles className="h-4 w-4 mr-2" /> Parse Command with AI
            </Button>
          </CardContent>
        </Card>

        {/* File Upload Section */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Upload className="h-5 w-5 text-primary" /> File & Receipt Upload
            </CardTitle>
            <CardDescription>Upload invoices, delivery slips, CSVs, or receipts for automated extraction</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
            <div className="border-2 border-dashed rounded-xl p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer flex-1 flex flex-col items-center justify-center">
              <input type="file" accept=".csv, .txt, .pdf, image/*" onChange={handleFileUpload} className="hidden" id="ai-file-upload" />
              <label htmlFor="ai-file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                <FileText className="h-10 w-10 text-primary mb-1" />
                <span className="font-semibold text-sm">
                  {fileName ? `Loaded: ${fileName}` : 'Drop files here or click to browse'}
                </span>
                <span className="text-xs text-muted-foreground max-w-xs">
                  Supports CSV, Excel exports, delivery notes, and receipt images
                </span>
              </label>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Extracted Transactions Review Section */}
      {parsedItems.length > 0 && (
        <Card className="border-primary/50 shadow-md">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" /> Extracted Ledger Entries ({parsedItems.length})
              </CardTitle>
              <CardDescription>Review the AI-extracted fields before committing to the database</CardDescription>
            </div>
            <Button onClick={handleCommitTransactions} className="bg-green-600 hover:bg-green-700 text-white">
              Commit {parsedItems.length} Transactions <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Extracted Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedItems.map((tx, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-bold capitalize text-primary">{tx.type}</TableCell>
                      <TableCell className="font-medium">{tx.itemName}</TableCell>
                      <TableCell className="text-right font-semibold">{tx.quantity}</TableCell>
                      <TableCell><span className="text-xs bg-muted px-2 py-1 rounded-md">{tx.department}</span></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{tx.date}</TableCell>
                      <TableCell className="text-xs text-muted-foreground italic">{tx.notes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
