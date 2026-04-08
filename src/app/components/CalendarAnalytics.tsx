import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { InterventionRecord } from '../../types';

interface CalendarAnalyticsProps {
  records: InterventionRecord[];
  onDayClick?: (date: string, dayRecords: InterventionRecord[]) => void;
}

interface DayData {
  date: string;
  count: number;
  records: InterventionRecord[];
  isCurrentMonth: boolean;
  isToday: boolean;
}

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function parseDate(dateStr: string): Date | null {
  const trimmed = (dateStr ?? '').trim();
  const dmy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) {
    return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
  }
  const ymd = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymd) {
    return new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
  }
  return null;
}

export function CalendarAnalytics({ records, onDayClick }: CalendarAnalyticsProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const calendarData = useMemo(() => {
    // Group records by date
    const recordsByDate = new Map<string, InterventionRecord[]>();
    
    records.forEach((r) => {
      const date = parseDate(r.fecha ?? '');
      if (!date) return;
      const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      if (!recordsByDate.has(key)) {
        recordsByDate.set(key, []);
      }
      recordsByDate.get(key)!.push(r);
    });

    // Generate calendar grid
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: DayData[] = [];

    // Previous month days
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const date = new Date(currentYear, currentMonth - 1, day);
      const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      days.push({
        date: key,
        count: recordsByDate.get(key)?.length ?? 0,
        records: recordsByDate.get(key) ?? [],
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      const isToday = date.toDateString() === today.toDateString();
      days.push({
        date: key,
        count: recordsByDate.get(key)?.length ?? 0,
        records: recordsByDate.get(key) ?? [],
        isCurrentMonth: true,
        isToday,
      });
    }

    // Next month days
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(currentYear, currentMonth + 1, day);
      const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      days.push({
        date: key,
        count: recordsByDate.get(key)?.length ?? 0,
        records: recordsByDate.get(key) ?? [],
        isCurrentMonth: false,
        isToday: false,
      });
    }

    return days;
  }, [records, currentMonth, currentYear, today]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDayClick = (dayData: DayData) => {
    if (dayData.count > 0 && onDayClick) {
      onDayClick(dayData.date, dayData.records);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Calendario de Evaluaciones
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[140px] text-center">
            {MONTHS_ES[currentMonth]} {currentYear}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {DAYS_ES.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 py-2"
          >
            {day}
          </div>
        ))}

        {/* Days */}
        {calendarData.map((dayData, idx) => {
          const dayNum = parseInt(dayData.date.split('-')[2]);
          const hasData = dayData.count > 0;

          return (
            <button
              key={idx}
              onClick={() => handleDayClick(dayData)}
              disabled={!hasData}
              className={`
                aspect-square rounded-lg p-2 text-sm font-medium transition-all relative
                ${!dayData.isCurrentMonth ? 'text-gray-300 dark:text-gray-700' : 'text-gray-700 dark:text-gray-300'}
                ${dayData.isToday ? 'ring-2 ring-teal-500 dark:ring-teal-400' : ''}
                ${hasData ? 'hover:bg-teal-50 dark:hover:bg-teal-900/20 cursor-pointer' : 'cursor-default'}
                ${!hasData && dayData.isCurrentMonth ? 'hover:bg-gray-50 dark:hover:bg-gray-800/50' : ''}
              `}
            >
              <span className={dayData.isToday ? 'font-bold' : ''}>{dayNum}</span>
              {hasData && (
                <span className="absolute bottom-1 right-1 w-5 h-5 flex items-center justify-center text-[10px] font-bold bg-teal-500 dark:bg-teal-600 text-white rounded-full">
                  {dayData.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg ring-2 ring-teal-500 dark:ring-teal-400"></div>
          <span className="text-gray-600 dark:text-gray-400">Día actual</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center">
            <span className="text-[8px] font-bold text-teal-600 dark:text-teal-400">5</span>
          </div>
          <span className="text-gray-600 dark:text-gray-400">Con evaluaciones</span>
        </div>
      </div>
    </div>
  );
}
