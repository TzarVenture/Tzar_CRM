"use client";

import React from "react";
import { BookOpen, GraduationCap, UserCheck, CalendarBlank as Calendar, Target, Clock } from "@phosphor-icons/react";
import { ILead } from "@/models/Lead";

interface AdshalaaSpecsCardProps {
  lead: Partial<ILead>;
}

export function AdshalaaSpecsCard({ lead }: AdshalaaSpecsCardProps) {
  const data = lead.adshalaaData;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-foreground" /> Adshalaa EdTech Admission & Learning Profile
        </h3>
        <span className="text-sm text-muted-foreground">
          Digital Marketing Institute
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        {/* Course Name */}
        <div className="bg-muted p-3.5 rounded-lg border border-border space-y-1 sm:col-span-2">
          <p className="text-muted-foreground font-medium flex items-center gap-1">
            <GraduationCap className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> Course / Program Applied
          </p>
          <p className="font-semibold text-foreground text-sm break-words">
            {data?.courseName || data?.programName || lead.interestedServices?.[0] || "Certification in Advanced Digital Marketing & AI"}
          </p>
        </div>

        {/* Candidate Status */}
        <div className="bg-muted p-3.5 rounded-lg border border-border space-y-1">
          <p className="text-muted-foreground font-medium flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> Current Profile
          </p>
          <p className="font-semibold text-foreground text-sm break-words">
            {data?.studentStatus || data?.professionalStatus || "Not Specified"}
          </p>
        </div>

        {/* Learning Mode */}
        <div className="bg-muted p-3.5 rounded-lg border border-border space-y-1">
          <p className="text-muted-foreground font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> Preferred Learning Mode
          </p>
          <p className="font-semibold text-foreground text-sm break-words">
            {data?.learningMode || "Classroom / Live Online"}
          </p>
        </div>

        {/* Batch Selection */}
        <div className="bg-muted p-3.5 rounded-lg border border-border space-y-1">
          <p className="text-muted-foreground font-medium flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> Batch Timing
          </p>
          <p className="font-semibold text-foreground text-sm break-words">
            {data?.batch || "Weekend Batch (Sat-Sun)"}
          </p>
        </div>

        {/* Career Goal */}
        <div className="bg-muted p-3.5 rounded-lg border border-border space-y-1">
          <p className="text-muted-foreground font-medium flex items-center gap-1">
            <Target className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> Career Objective
          </p>
          <p className="font-semibold text-foreground text-sm break-words">
            {data?.careerGoal || data?.goals || "High-Growth Agency Placement"}
          </p>
        </div>
      </div>
    </div>
  );
}
