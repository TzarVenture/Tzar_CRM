"use client";

import React, { useState, useRef, useEffect } from "react";
import { CalendarBlank as CalendarIcon, DownloadSimple as Download, CaretDown as ChevronDown, Sparkle as Sparkles, ShieldCheck, Check, CaretLeft as ChevronLeft, CaretRight as ChevronRight, X } from "@phosphor-icons/react";
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
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
            Welcome back, {userName.split(" ")[0]}
          </h1>
        </div>
        <p className="text-sm sm:text-sm font-semibold text-muted-foreground mt-0.5">
          New leads, deals won and conversion across all four brands
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
            className="flex items-center gap-1.5 px-3 py-2 bg-card border border-border hover:border-input rounded-xl text-foreground font-semibold text-sm shadow-2xs transition-all cursor-pointer"
          >
            <span>{period}</span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-32 bg-card border border-border rounded-xl shadow-lg z-20 py-1 overflow-hidden animate-fade-in">
              {(["Daily", "Weekly", "Monthly", "Yearly"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setPeriod(p);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-sm font-semibold hover:bg-muted cursor-pointer ${
                    period === p ? "text-success font-semibold bg-success-soft" : "text-foreground"
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
            className="flex items-center gap-2 px-3.5 py-2 bg-card hover:bg-muted border border-border hover:border-input rounded-xl text-foreground font-semibold text-sm shadow-2xs transition-all cursor-pointer"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
            <span>{format(selectedDate, "d MMM yyyy")}</span>
            <ChevronDown className="w-3 h-3 text-muted-foreground ml-0.5" />
          </button>

          {/* Calendar Picker Modal / Popup */}
          {isCalendarOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-card border border-border rounded-2xl shadow-2xl z-30 p-4 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <span className="text-sm font-semibold text-foreground">Select Reporting Date</span>
                <button
                  onClick={() => setIsCalendarOpen(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Presets */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground ">
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
                        className={`px-2.5 py-1.5 rounded-lg text-sm font-semibold text-left transition-colors flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? "bg-primary text-white"
                            : "bg-muted text-foreground hover:bg-muted border border-border"
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
              <div className="space-y-1 pt-1 border-t border-border">
                <span className="text-xs font-semibold text-muted-foreground ">
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
                  className="w-full px-3 py-1.5 text-sm font-semibold rounded-xl border border-border bg-muted focus:bg-card focus:border-ring outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setIsCalendarOpen(false)}
                  className="px-3.5 py-1.5 bg-primary text-white font-semibold text-sm rounded-xl hover:bg-primary-hover transition-all cursor-pointer"
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
          className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white font-semibold text-sm rounded-xl shadow-2xs transition-all cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>
    </div>
  );
}
