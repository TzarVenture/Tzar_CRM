"use client";

import React from "react";
import { BookOpen, GraduationCap, UserCheck, Calendar, Target, Clock } from "lucide-react";
import { ILead } from "@/models/Lead";

interface AdshalaaSpecsCardProps {
  lead: Partial<ILead>;
}

export function AdshalaaSpecsCard({ lead }: AdshalaaSpecsCardProps) {
  const data = lead.adshalaaData;

  return (
    <div className="bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-white p-5 rounded-2xl border border-blue-200 space-y-4 shadow-2xs">
      <div className="flex items-center justify-between pb-2 border-b border-blue-200/80">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-blue-950 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-700" /> Adshalaa EdTech Admission & Learning Profile
        </h3>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
          Digital Marketing Institute
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
        {/* Course Name */}
        <div className="bg-white/90 p-3.5 rounded-xl border border-blue-100 space-y-1 sm:col-span-2">
          <p className="text-slate-500 font-medium flex items-center gap-1">
            <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Course / Program Applied
          </p>
          <p className="font-extrabold text-blue-950 text-sm break-words">
            {data?.courseName || data?.programName || lead.interestedServices?.[0] || "Certification in Advanced Digital Marketing & AI"}
          </p>
        </div>

        {/* Candidate Status */}
        <div className="bg-white/90 p-3.5 rounded-xl border border-blue-100 space-y-1">
          <p className="text-slate-500 font-medium flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Current Profile
          </p>
          <p className="font-extrabold text-blue-700 text-sm break-words">
            {data?.studentStatus || data?.professionalStatus || "Not Specified"}
          </p>
        </div>

        {/* Learning Mode */}
        <div className="bg-white/90 p-3.5 rounded-xl border border-blue-100 space-y-1">
          <p className="text-slate-500 font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Preferred Learning Mode
          </p>
          <p className="font-bold text-slate-800 text-xs break-words">
            {data?.learningMode || "Classroom / Live Online"}
          </p>
        </div>

        {/* Batch Selection */}
        <div className="bg-white/90 p-3.5 rounded-xl border border-blue-100 space-y-1">
          <p className="text-slate-500 font-medium flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Batch Timing
          </p>
          <p className="font-bold text-slate-800 text-xs break-words">
            {data?.batch || "Weekend Batch (Sat-Sun)"}
          </p>
        </div>

        {/* Career Goal */}
        <div className="bg-white/90 p-3.5 rounded-xl border border-blue-100 space-y-1">
          <p className="text-slate-500 font-medium flex items-center gap-1">
            <Target className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Career Objective
          </p>
          <p className="font-bold text-slate-800 text-xs break-words">
            {data?.careerGoal || data?.goals || "High-Growth Agency Placement"}
          </p>
        </div>
      </div>
    </div>
  );
}
