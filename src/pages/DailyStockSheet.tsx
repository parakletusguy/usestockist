import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import StockEntryTable from '@/components/daily-stock/StockEntryTable';

const TEAM_MEMBERS = [
  'Nene Spiff',
  'Roseline Ihuoma',
  'Ruth Deekae',
  'Chiamaka Akuwueze',
  'Raphael Favour',
  'Joy Chinenye',
  'Priye',
  'Chinasa',
  'Mercy'
];

const DailyStockSheet = () => {
  const [date, setDate] = useState<Date>(new Date());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Daily Stock Sheet</h1>
        <p className="text-muted-foreground">Record daily stock movements by retail team member</p>
      </div>

      {/* Date Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Date</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full sm:w-[240px] justify-start text-left font-normal")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(date, 'PPP')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Team Member Tabs */}
      <Tabs defaultValue={TEAM_MEMBERS[0]} className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1">
          {TEAM_MEMBERS.map(member => (
            <TabsTrigger key={member} value={member} className="text-xs sm:text-sm">
              {member.split(' ')[0]}
            </TabsTrigger>
          ))}
        </TabsList>
        {TEAM_MEMBERS.map(member => (
          <TabsContent key={member} value={member}>
            <StockEntryTable date={date} teamMember={member} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default DailyStockSheet;
