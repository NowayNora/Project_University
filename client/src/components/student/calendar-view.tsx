import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const { data: scheduleData } = useQuery({
    queryKey: ["/api/student/schedule"],
  });

  const getMonthName = (date: Date) => {
    return date.toLocaleString('vi-VN', { month: 'long', year: 'numeric' });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // First day of month and number of days
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    
    // Day of week for first day (0-6, Sunday-Saturday)
    const firstDayWeekday = firstDayOfMonth.getDay();
    
    // Days from previous month
    const prevMonthDays = [];
    if (firstDayWeekday > 0) { // If month doesn't start on Sunday
      const prevLastDay = new Date(year, month, 0).getDate();
      for (let i = prevLastDay - firstDayWeekday + 1; i <= prevLastDay; i++) {
        prevMonthDays.push({
          day: i,
          currentMonth: false,
          date: new Date(year, month - 1, i)
        });
      }
    }
    
    // Days from current month
    const currentMonthDays = [];
    for (let i = 1; i <= daysInMonth; i++) {
      currentMonthDays.push({
        day: i,
        currentMonth: true,
        date: new Date(year, month, i),
        isToday: new Date(year, month, i).toDateString() === new Date().toDateString()
      });
    }
    
    // Days from next month
    const nextMonthDays = [];
    const totalDisplayedDays = prevMonthDays.length + currentMonthDays.length;
    const nextDaysNeeded = 42 - totalDisplayedDays; // 42 for a 6-row calendar
    
    for (let i = 1; i <= nextDaysNeeded; i++) {
      nextMonthDays.push({
        day: i,
        currentMonth: false,
        date: new Date(year, month + 1, i)
      });
    }
    
    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  };

  const hasEvent = (date: Date) => {
    if (!scheduleData) return [];
    
    const events = [];
    
    // Check if there's a class on this date
    const classEvents = scheduleData.filter((event: any) => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === date.toDateString();
    });
    
    if (classEvents.length > 0) {
      events.push('class');
    }
    
    // Could add more event types here
    
    return events;
  };

  const navigateToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const navigateToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const daysOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const calendarDays = getDaysInMonth(currentDate);

  return (
    <Card>
      <CardHeader className="px-4 py-3 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base font-semibold">Lịch tháng</CardTitle>
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              onClick={navigateToPreviousMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium">{getMonthName(currentDate)}</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              onClick={navigateToNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {daysOfWeek.map((day, index) => (
            <div 
              key={index} 
              className="aspect-square flex items-center justify-center font-medium text-gray-600 text-sm"
            >
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, index) => {
            const events = hasEvent(day.date);
            return (
              <div 
                key={index} 
                className={`aspect-square flex flex-col items-center justify-center border border-gray-100 text-sm rounded-sm
                  ${!day.currentMonth ? 'text-gray-400' : ''} 
                  ${day.isToday ? 'bg-primary-50 text-primary-600 font-semibold' : ''}
                `}
              >
                <span>{day.day}</span>
                <div className="flex mt-1 space-x-1">
                  {events.includes('class') && (
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  )}
                  {events.includes('exam') && (
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                  )}
                  {events.includes('assignment') && (
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-3 flex flex-wrap gap-3">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
            <span className="text-xs text-gray-600">Buổi học</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
            <span className="text-xs text-gray-600">Kiểm tra</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
            <span className="text-xs text-gray-600">Bài tập</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div>
            <span className="text-xs text-gray-600">Hạn chót</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-purple-500 rounded-full mr-1"></div>
            <span className="text-xs text-gray-600">Sự kiện khác</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
