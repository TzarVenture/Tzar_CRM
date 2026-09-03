"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Download,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, isSameDay } from "date-fns";

interface OverviewHeaderProps {
  userName: string;
  userRole: string;
  totalLeads: number;
  totalRevenue: number;
}

export function OverviewHeader({
  userName,
  userRole,
  totalLeads,
  totalRevenue,
}: OverviewHeaderProps) {
  const [period, setPeriod] = useState<"Daily" | "Weekly" | "Monthly" | "Yearly">("Monthly");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Interactive Calendar / Date Picker State
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activePreset, setActivePreset] = useState<string>("Today");
  const calendarRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close popups on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExportSummary = () => {
    const csvRows = [
      ["Metric", "Value"],
      ["Report Date", format(new Date(), "yyyy-MM-dd HH:mm:ss")],
      ["Filtered Date", format(selectedDate, "yyyy-MM-dd")],
      ["User", userName],
      ["Role", userRole],
      ["Total Active Leads", String(totalLeads)],
      ["Total Pipeline Value (INR)", String(totalRevenue)],
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      csvRows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `tzar_crm_overview_${format(new Date(), "yyyyMMdd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const presets = [
    { label: "Today", date: new Date() },
    { label: "Yesterday", date: subDays(new Date(), 1) },
    { label: "Last 7 Days", date: subDays(new Date(), 7) },
    { label: "Last 30 Days", date: subDays(new Date(), 30) },
    { label: "Start of Month", date: startOfMonth(new Date()) },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
      {/* Main Welcome Heading */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Welcome back, {userName.split(" ")[0]}
          </h1>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync
          </span>
        </div>
        <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">
          Real-time pipeline analytics, lead acquisition velocity, and team performance
        </p>
      </div>

      {/* Action Controls (Period Filter, Interactive Calendar, Export CSV) */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Period Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => {
              setIsDropdownOpen(!isDropdownOpen);
              setIsCalendarOpen(false);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-slate-700 font-bold text-xs shadow-2xs transition-all cursor-pointer"
          >
            <span>{period}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-32 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden animate-fade-in">
              {(["Daily", "Weekly", "Monthly", "Yearly"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setPeriod(p);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 cursor-pointer ${
                    period === p ? "text-emerald-700 font-bold bg-emerald-50/50" : "text-slate-700"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Fully Interactive Date / Calendar Picker Button */}
        <div className="relative" ref={calendarRef}>
          <button
            onClick={() => {
              setIsCalendarOpen(!isCalendarOpen);
              setIsDropdownOpen(false);
            }}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-slate-700 font-bold text-xs shadow-2xs transition-all cursor-pointer"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-slate-500" />
            <span>{format(selectedDate, "d MMM yyyy")}</span>
            <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
          </button>

          {/* Calendar Picker Modal / Popup */}
          {isCalendarOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl z-30 p-4 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="text-xs font-bold text-slate-900">Select Reporting Date</span>
                <button
                  onClick={() => setIsCalendarOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Presets */}
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Quick Presets
                </span>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {presets.map((preset) => {
                    const isSelected = activePreset === preset.label;
                    return (
                      <button
                        key={preset.label}
                        onClick={() => {
                          setSelectedDate(preset.date);
                          setActivePreset(preset.label);
                          setIsCalendarOpen(false);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold text-left transition-colors flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? "bg-slate-900 text-white"
                            : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-100"
                        }`}
                      >
                        <span className="truncate">{preset.label}</span>
                        {isSelected && <Check className="w-3 h-3" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Date Input */}
              <div className="space-y-1 pt-1 border-t border-slate-100">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Custom Date
                </span>
                <input
                  type="date"
                  value={format(selectedDate, "yyyy-MM-dd")}
                  onChange={(e) => {
                    if (e.target.value) {
                      const [y, m, d] = e.target.value.split("-").map(Number);
                      setSelectedDate(new Date(y, m - 1, d));
                      setActivePreset("Custom");
                    }
                  }}
                  className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setIsCalendarOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Apply Date
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Export CSV Button */}
        <button
          onClick={handleExportSummary}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>
    </div>
  );
}
