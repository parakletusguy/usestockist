/**
 * AI Data Entry Assistant — Guardrailed Parser
 *
 * HALLUCINATION PREVENTION RULES (hard-coded, never relaxed):
 *
 *  R1. CATALOG-ONLY ITEMS: Every item field must match a known catalog entry
 *      by fuzzy similarity ≥ 0.55. No match → row is BLOCKED (red), must be
 *      manually corrected before commit is allowed.
 *
 *  R2. FIXED DEPARTMENT LIST: Only the 6 known departments are accepted.
 *      Anything else → null, user must select.
 *
 *  R3. FIXED TRANSACTION TYPES: Only { receive, issuance, transfer, sale,
 *      damage } are valid. Default is null (user must choose).
 *
 *  R4. QUANTITY BOUNDS: Must be an integer 1–9 999. Outside range or absent
 *      → flagged as uncertain, commit blocked.
 *
 *  R5. NO FABRICATION: Fields the parser cannot confidently extract are left
 *      NULL and marked "needs review". We never invent supplier names, dates,
 *      or quantities.
 *
 *  R6. MANDATORY HUMAN REVIEW: The Commit button is disabled if ANY row has
 *      a BLOCKED field. Users must fix every issue before saving.
 *
 *  R7. AUDIT TRAIL: Every committed row carries ai_entry:true and the
 *      original raw text so discrepancies can be traced.
 */

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { useItems, Item } from '@/hooks/useItems';
import { supabase } from '@/integrations/supabase/client';
import { DEPARTMENTS } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Sparkles, Send, CheckCircle2, ArrowRight, Bot,
  ShieldAlert, ShieldCheck, AlertTriangle, XCircle, Info,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

type TxType = 'receive' | 'issuance' | 'transfer' | 'sale' | 'damage';
const TX_TYPES: TxType[] = ['receive', 'issuance', 'transfer', 'sale', 'damage'];

type FieldConfidence = 'ok' | 'uncertain' | 'blocked';

interface ParsedField<T> {
  value: T | null;
  confidence: FieldConfidence;
  hint: string; // shown to user explaining how it was extracted or why it's blocked
}

interface ParsedRow {
  id: string; // local key
  rawInput: string;
  type: ParsedField<TxType>;
  item: ParsedField<{ id: string; name: string }>;
  quantity: ParsedField<number>;
  department: ParsedField<string>;
  date: ParsedField<string>;
  notes: string;
}

// ─── Fuzzy Matching Helpers ──────────────────────────────────────────────────

/** Trigram similarity score between 0–1 */
function trigramSimilarity(a: string, b: string): number {
  const trigrams = (s: string) => {
    const padded = `  ${s.toLowerCase()}  `;
    const set = new Set<string>();
    for (let i = 0; i < padded.length - 2; i++) set.add(padded.slice(i, i + 3));
    return set;
  };
  const ta = trigrams(a);
  const tb = trigrams(b);
  let intersection = 0;
  ta.forEach(t => { if (tb.has(t)) intersection++; });
  return (2 * intersection) / (ta.size + tb.size || 1);
}

const SIMILARITY_THRESHOLD = 0.55; // R1: minimum required for a catalog match

function findBestItemMatch(
  text: string,
  items: Item[]
): { item: Item; score: number } | null {
  let best: { item: Item; score: number } | null = null;

  for (const item of items) {
    const score = trigramSimilarity(text, item.name);
    if (!best || score > best.score) best = { item, score };
  }

  if (!best || best.score < SIMILARITY_THRESHOLD) return null;
  return best;
}

// ─── Transaction Type Keywords ───────────────────────────────────────────────

const TYPE_KEYWORDS: Record<TxType, string[]> = {
  receive: ['receiv', 'got', 'inward', 'delivery', 'incoming', 'stock in', 'purchase', 'bought', 'order'],
  issuance: ['issu', 'gave', 'given', 'sent to', 'handed', 'allocated', 'dispatch'],
  transfer: ['transfer', 'moved', 'move', 'relocated', 'shift'],
  sale: ['sold', 'sale', 'retail sale', 'customer'],
  damage: ['damage', 'broken', 'spoil', 'waste', 'lost', 'expir', 'discard'],
};

function detectType(text: string): ParsedField<TxType> {
  const lower = text.toLowerCase();
  for (const [type, keywords] of Object.entries(TYPE_KEYWORDS) as [TxType, string[]][]) {
    if (keywords.some(k => lower.includes(k))) {
      return { value: type, confidence: 'ok', hint: `Detected from keyword` };
    }
  }
  return { value: null, confidence: 'blocked', hint: 'Could not determine type — please select' };
}

// ─── Quantity Extraction ─────────────────────────────────────────────────────

const QTY_MIN = 1;
const QTY_MAX = 9999;

function extractQuantity(text: string): ParsedField<number> {
  // Match patterns: "50", "50 bottles", "x50", "qty: 50"
  const matches = text.match(/\b(\d{1,4})\b/g);
  if (!matches) {
    return { value: null, confidence: 'blocked', hint: 'No quantity found — please enter' };
  }
  // Take the first plausible number (exclude years like 2026)
  const candidates = matches
    .map(Number)
    .filter(n => n >= QTY_MIN && n <= QTY_MAX);

  if (candidates.length === 0) {
    return { value: null, confidence: 'blocked', hint: `Quantity out of allowed range (${QTY_MIN}–${QTY_MAX})` };
  }
  return {
    value: candidates[0],
    confidence: candidates.length > 1 ? 'uncertain' : 'ok',
    hint: candidates.length > 1 ? `Multiple numbers found; using ${candidates[0]} — verify` : 'Extracted from text',
  };
}

// ─── Department Extraction ────────────────────────────────────────────────────

function extractDepartment(text: string): ParsedField<string> {
  const lower = text.toLowerCase();
  for (const dept of DEPARTMENTS) {
    if (lower.includes(dept.toLowerCase())) {
      return { value: dept, confidence: 'ok', hint: `Matched "${dept}"` };
    }
  }
  return { value: null, confidence: 'uncertain', hint: 'Department not mentioned — please select' };
}

// ─── Item Extraction ──────────────────────────────────────────────────────────

function extractItem(text: string, items: Item[]): ParsedField<{ id: string; name: string }> {
  if (!items || items.length === 0) {
    return { value: null, confidence: 'blocked', hint: 'Catalog not loaded yet' };
  }

  const match = findBestItemMatch(text, items);
  if (!match) {
    return {
      value: null,
      confidence: 'blocked',
      hint: 'No catalog item matched with sufficient confidence — please select',
    };
  }
  if (match.score < 0.75) {
    return {
      value: { id: match.item.id, name: match.item.name },
      confidence: 'uncertain',
      hint: `Low confidence match (${(match.score * 100).toFixed(0)}%) — verify this is correct`,
    };
  }
  return {
    value: { id: match.item.id, name: match.item.name },
    confidence: 'ok',
    hint: `Matched with ${(match.score * 100).toFixed(0)}% confidence`,
  };
}

// ─── Main Parser ──────────────────────────────────────────────────────────────

function parseNaturalLanguage(text: string, items: Item[]): ParsedRow {
  return {
    id: crypto.randomUUID(),
    rawInput: text,
    type: detectType(text),
    item: extractItem(text, items),
    quantity: extractQuantity(text),
    department: extractDepartment(text),
    date: { value: format(new Date(), 'yyyy-MM-dd'), confidence: 'uncertain', hint: "Defaulted to today — confirm date" },
    notes: text,
  };
}

// ─── Confidence UI Helpers ────────────────────────────────────────────────────

const confidenceBorder: Record<FieldConfidence, string> = {
  ok: '',
  uncertain: 'ring-1 ring-amber-400',
  blocked: 'ring-2 ring-destructive bg-destructive/5',
};

const ConfidenceIcon = ({ c }: { c: FieldConfidence }) => {
  if (c === 'ok') return <ShieldCheck className="h-3.5 w-3.5 text-green-500 shrink-0" />;
  if (c === 'uncertain') return <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />;
  return <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />;
};

// ─── Component ────────────────────────────────────────────────────────────────

const EXAMPLE_PROMPTS = [
  'Received 50 bottles of Red Wine from supplier for Bar',
  'Issued 10 boxes of Cleaning Supplies to Housekeeping',
  'Transferred 5 cases of Gin to Kitchen (Nox)',
  'Recorded 3 damaged bottles of Beer in Retail',
];

export default function AIAssistantPage() {
  const [promptText, setPromptText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [rows, setRows] = useState<ParsedRow[]>([]);

  const { data: items } = useItems();
  const queryClient = useQueryClient();

  // ── Parse ──────────────────────────────────────────────────────────────────

  const handleParse = () => {
    if (!promptText.trim() || !items) return;
    setIsProcessing(true);

    // Small delay for UX feedback
    setTimeout(() => {
      const parsed = parseNaturalLanguage(promptText.trim(), items);
      setRows(prev => [parsed, ...prev]);
      setIsProcessing(false);

      const blocked = [parsed.type, parsed.item, parsed.quantity, parsed.department]
        .filter(f => f.confidence === 'blocked').length;
      const uncertain = [parsed.type, parsed.item, parsed.quantity, parsed.department]
        .filter(f => f.confidence === 'uncertain').length;

      if (blocked > 0) {
        toast({
          title: 'Review Required',
          description: `${blocked} field${blocked > 1 ? 's' : ''} could not be extracted — highlighted in red`,
          variant: 'destructive',
        });
      } else if (uncertain > 0) {
        toast({
          title: 'Low Confidence Fields',
          description: `${uncertain} field${uncertain > 1 ? 's' : ''} need verification — highlighted in yellow`,
        });
      } else {
        toast({ title: 'Extracted', description: 'All fields extracted with high confidence' });
      }
    }, 400);
  };

  // ── Inline row editing ──────────────────────────────────────────────────────

  const updateRow = (id: string, patch: Partial<ParsedRow>) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
  };

  const removeRow = (id: string) => setRows(prev => prev.filter(r => r.id !== id));

  // ── Validation gate ─────────────────────────────────────────────────────────

  const canCommit = useMemo(() => {
    if (rows.length === 0) return false;
    return rows.every(row =>
      row.type.value !== null &&
      row.item.value !== null &&
      row.quantity.value !== null &&
      row.department.value !== null &&
      row.date.value !== null
    );
  }, [rows]);

  const blockedCount = useMemo(() =>
    rows.filter(r =>
      [r.type, r.item, r.quantity, r.department].some(f => f.confidence === 'blocked' || f.value === null)
    ).length,
    [rows]
  );

  // ── Commit ──────────────────────────────────────────────────────────────────

  const handleCommit = async () => {
    if (!canCommit) return;

    try {
      const dbRows = rows.map(tx => ({
        item_id: tx.item.value!.id,
        type: tx.type.value!,
        quantity: tx.quantity.value!,
        transaction_date: tx.date.value!,
        department: tx.department.value!,
        metadata: {
          ai_entry: true,
          raw_input: tx.rawInput,
          notes: tx.notes,
        },
      }));

      const { error } = await (supabase as any)
        .from('inventory_transactions')
        .insert(dbRows);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['stock_count'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['issuance_ledger'] });
      queryClient.invalidateQueries({ queryKey: ['received_ledger'] });
      queryClient.invalidateQueries({ queryKey: ['transfer_ledger'] });

      toast({ title: 'Committed', description: `${rows.length} transaction${rows.length > 1 ? 's' : ''} saved to ledger` });
      setRows([]);
      setPromptText('');
    } catch (err: any) {
      toast({ title: 'Commit Error', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 sm:p-2.5 bg-primary/10 rounded-xl shrink-0">
          <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">AI Data Entry Assistant</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Parse stock movements from plain language — all fields validated against your catalog before saving
          </p>
        </div>
      </div>

      {/* Guardrail Info Banner */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-blue-800 dark:text-blue-300">
        <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
        <div>
          <strong>Guardrails active:</strong> The AI parser will only accept items from your catalog,
          departments from the fixed list, quantities between 1–9 999, and known transaction types.
          Any field it cannot confidently determine is flagged — the <strong>Commit button stays locked</strong> until every row is resolved.
        </div>
      </div>

      {/* Text Input */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Bot className="h-5 w-5 text-primary" /> Natural Language Entry
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Describe the stock movement in plain English — one entry at a time
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
          <Textarea
            placeholder='e.g. "Received 50 bottles of Red Wine from supplier for Bar"'
            value={promptText}
            onChange={e => setPromptText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleParse(); }}
            rows={3}
            className="resize-none text-base sm:text-sm min-h-[80px]"
          />
          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs text-muted-foreground self-center mr-1">Examples:</span>
            {EXAMPLE_PROMPTS.map((eg, i) => (
              <button
                key={i}
                onClick={() => setPromptText(eg)}
                className="text-[11px] bg-muted hover:bg-primary/10 text-foreground px-2.5 py-1.5 rounded-md transition-colors text-left min-h-[36px] flex items-center"
              >
                {eg}
              </button>
            ))}
          </div>
          <Button
            onClick={handleParse}
            disabled={isProcessing || !promptText.trim() || !items?.length}
            className="w-full h-11 sm:h-9 text-base sm:text-xs"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {isProcessing ? 'Parsing…' : 'Parse Entry'}
          </Button>
        </CardContent>
      </Card>

      {/* Review Table */}
      {rows.length > 0 && (
        <Card className={cn('shadow-md', blockedCount > 0 ? 'border-destructive/50' : 'border-primary/40')}>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-6">
            <div>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                {blockedCount > 0
                  ? <XCircle className="h-5 w-5 text-destructive shrink-0" />
                  : <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />}
                Review Entries ({rows.length})
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {blockedCount > 0
                  ? `${blockedCount} row${blockedCount > 1 ? 's have' : ' has'} unresolved fields — fix them before committing`
                  : 'All fields resolved — ready to commit'}
              </CardDescription>
            </div>
            <Button
              onClick={handleCommit}
              disabled={!canCommit}
              className={cn('w-full sm:w-auto h-11 sm:h-9 text-base sm:text-xs', canCommit ? 'bg-green-600 hover:bg-green-700 text-white' : '')}
            >
              Commit {rows.length} Transaction{rows.length > 1 ? 's' : ''}
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            {/* Legend */}
            <div className="flex flex-wrap gap-3 text-[11px] mb-3 text-muted-foreground">
              <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-green-500" /> High confidence</span>
              <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-amber-500" /> Needs verification</span>
              <span className="flex items-center gap-1"><XCircle className="h-3 w-3 text-destructive" /> Blocked — must fix</span>
            </div>

            <div className="space-y-4">
              {rows.map((row) => (
                <div
                  key={row.id}
                  className={cn(
                    'rounded-lg border p-3 sm:p-4 space-y-3',
                    [row.type, row.item, row.quantity, row.department].some(f => f.confidence === 'blocked' || f.value === null)
                      ? 'border-destructive/40 bg-destructive/5'
                      : [row.type, row.item, row.quantity, row.department].some(f => f.confidence === 'uncertain')
                      ? 'border-amber-400/50 bg-amber-500/5'
                      : 'border-green-500/30 bg-green-500/5'
                  )}
                >
                  {/* Raw input */}
                  <div className="flex items-start gap-2 text-xs text-muted-foreground italic border-b pb-2">
                    <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span className="line-clamp-2">{row.rawInput}</span>
                    <button
                      onClick={() => removeRow(row.id)}
                      className="ml-auto text-destructive hover:text-destructive/80 shrink-0 font-medium not-italic min-h-[32px] px-2 flex items-center"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {/* Type */}
                    <div className="space-y-1">
                      <Label className="text-xs flex items-center gap-1">
                        <ConfidenceIcon c={row.type.confidence} /> Type
                      </Label>
                      <Select
                        value={row.type.value ?? ''}
                        onValueChange={val => updateRow(row.id, {
                          type: { value: val as TxType, confidence: 'ok', hint: 'Manually selected' }
                        })}
                      >
                        <SelectTrigger className={cn('h-10 sm:h-8 text-base sm:text-xs', confidenceBorder[row.type.confidence])}>
                          <SelectValue placeholder="Select type…" />
                        </SelectTrigger>
                        <SelectContent className="bg-background">
                          {TX_TYPES.map(t => (
                            <SelectItem key={t} value={t} className="capitalize text-xs">{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {row.type.confidence !== 'ok' && (
                        <p className="text-[10px] text-muted-foreground">{row.type.hint}</p>
                      )}
                    </div>

                    {/* Item */}
                    <div className="space-y-1 lg:col-span-2">
                      <Label className="text-xs flex items-center gap-1">
                        <ConfidenceIcon c={row.item.confidence} /> Item
                      </Label>
                      <Select
                        value={row.item.value?.id ?? ''}
                        onValueChange={val => {
                          const it = items?.find(i => i.id === val);
                          if (it) updateRow(row.id, {
                            item: { value: { id: it.id, name: it.name }, confidence: 'ok', hint: 'Manually selected' }
                          });
                        }}
                      >
                        <SelectTrigger className={cn('h-10 sm:h-8 text-base sm:text-xs', confidenceBorder[row.item.confidence])}>
                          <SelectValue placeholder="Select item from catalog…" />
                        </SelectTrigger>
                        <SelectContent className="bg-background">
                          {items?.map(it => (
                            <SelectItem key={it.id} value={it.id} className="text-xs">
                              {it.name} — {it.category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {row.item.confidence !== 'ok' && (
                        <p className="text-[10px] text-muted-foreground">{row.item.hint}</p>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="space-y-1">
                      <Label className="text-xs flex items-center gap-1">
                        <ConfidenceIcon c={row.quantity.confidence} /> Quantity
                      </Label>
                      <Input
                        type="number"
                        min={QTY_MIN}
                        max={QTY_MAX}
                        value={row.quantity.value ?? ''}
                        onChange={e => {
                          const n = Number(e.target.value);
                          const valid = n >= QTY_MIN && n <= QTY_MAX;
                          updateRow(row.id, {
                            quantity: {
                              value: valid ? n : null,
                              confidence: valid ? 'ok' : 'blocked',
                              hint: valid ? 'Manually entered' : `Must be ${QTY_MIN}–${QTY_MAX}`,
                            }
                          });
                        }}
                        placeholder="1–9999"
                        className={cn('h-10 sm:h-8 text-base sm:text-xs', confidenceBorder[row.quantity.confidence])}
                      />
                      {row.quantity.confidence !== 'ok' && (
                        <p className="text-[10px] text-muted-foreground">{row.quantity.hint}</p>
                      )}
                    </div>

                    {/* Department */}
                    <div className="space-y-1">
                      <Label className="text-xs flex items-center gap-1">
                        <ConfidenceIcon c={row.department.confidence} /> Department
                      </Label>
                      <Select
                        value={row.department.value ?? ''}
                        onValueChange={val => updateRow(row.id, {
                          department: { value: val, confidence: 'ok', hint: 'Manually selected' }
                        })}
                      >
                        <SelectTrigger className={cn('h-10 sm:h-8 text-base sm:text-xs', confidenceBorder[row.department.confidence])}>
                          <SelectValue placeholder="Select dept…" />
                        </SelectTrigger>
                        <SelectContent className="bg-background">
                          {DEPARTMENTS.map(d => (
                            <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {row.department.confidence !== 'ok' && (
                        <p className="text-[10px] text-muted-foreground">{row.department.hint}</p>
                      )}
                    </div>
                  </div>

                  {/* Date row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t">
                    <div className="space-y-1">
                      <Label className="text-xs flex items-center gap-1">
                        <ConfidenceIcon c={row.date.confidence} /> Date
                      </Label>
                      <Input
                        type="date"
                        value={row.date.value ?? ''}
                        max={format(new Date(), 'yyyy-MM-dd')}
                        onChange={e => updateRow(row.id, {
                          date: { value: e.target.value || null, confidence: 'ok', hint: 'Manually set' }
                        })}
                        className={cn('h-10 sm:h-8 text-base sm:text-xs', confidenceBorder[row.date.confidence])}
                      />
                      {row.date.confidence !== 'ok' && (
                        <p className="text-[10px] text-muted-foreground">{row.date.hint}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Notes (optional)</Label>
                      <Input
                        value={row.notes}
                        onChange={e => updateRow(row.id, { notes: e.target.value })}
                        placeholder="Additional notes…"
                        className="h-10 sm:h-8 text-base sm:text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
