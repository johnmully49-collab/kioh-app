"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Opportunity } from "@/server/types/opportunity";
import { Mentor } from "@/server/types/mentor";
import type { UploadedDocument } from "@/server/types/uploads";

export interface ApplicationDocuments {
  pitchDeck?: UploadedDocument;
  certificates: UploadedDocument[];
}

export interface AppliedOpportunity {
  id: string;
  opportunity: Opportunity;
  appliedAt: string;
  statusUpdatedAt?: string;
  status: "Under Review" | "Shortlisted" | "Accepted" | "Rejected";
  documents?: ApplicationDocuments;
}

export interface BookedSession {
  id: string;
  mentor: Mentor;
  day: string;
  timeSlot: string;
  topic: string;
  bookedAt: string;
  scheduledAt?: string;
  status: "Upcoming" | "Completed" | "Cancelled";
}

interface ApplicationContextType {
  appliedOpportunities: AppliedOpportunity[];
  bookedSessions: BookedSession[];
  applyToOpportunity: (
    opportunity: Opportunity,
    documents?: ApplicationDocuments
  ) => Promise<{ confirmationEmailSent: boolean }>;
  hasAppliedToOpportunity: (opportunityId: string) => boolean;
  bookMentorSession: (
    mentor: Mentor,
    day: string,
    timeSlot: string,
    topic: string
  ) => BookedSession;
  hasBookedMentor: (mentorId: string) => boolean;
}

const ApplicationContext = createContext<ApplicationContextType | undefined>(
  undefined
);

const LOCAL_STORAGE_KEY_APPS = "kioh_applied_opportunities";
const LOCAL_STORAGE_KEY_SESSIONS = "kioh_booked_sessions";

function getNextSessionDate(day: string, timeSlot: string): string {
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const targetDay = weekdays.indexOf(day);
  const timeMatch = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(timeSlot);
  if (targetDay < 0 || !timeMatch) {
    throw new Error("Choose a valid session day and time.");
  }

  const [, hourText, minuteText, meridiem] = timeMatch;
  let hour = Number(hourText) % 12;
  if (meridiem.toUpperCase() === "PM") hour += 12;
  const minute = Number(minuteText);
  if (minute > 59) {
    throw new Error("Choose a valid session time.");
  }

  const now = new Date();
  const scheduledAt = new Date(now);
  const daysAhead = (targetDay - now.getDay() + 7) % 7;
  scheduledAt.setDate(now.getDate() + daysAhead);
  scheduledAt.setHours(hour, minute, 0, 0);
  if (scheduledAt <= now) scheduledAt.setDate(scheduledAt.getDate() + 7);
  return scheduledAt.toISOString();
}

function isBookedSession(value: unknown): value is BookedSession {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  const mentor = record.mentor;
  return (
    typeof record.id === "string" &&
    typeof record.day === "string" &&
    typeof record.timeSlot === "string" &&
    typeof record.topic === "string" &&
    typeof record.bookedAt === "string" &&
    (record.scheduledAt === undefined ||
      typeof record.scheduledAt === "string") &&
    (record.status === "Upcoming" ||
      record.status === "Completed" ||
      record.status === "Cancelled") &&
    typeof mentor === "object" &&
    mentor !== null &&
    "id" in mentor &&
    "name" in mentor &&
    "avatar" in mentor &&
    typeof mentor.id === "string" &&
    typeof mentor.name === "string" &&
    typeof mentor.avatar === "string"
  );
}

export const ApplicationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const [appliedOpportunities, setAppliedOpportunities] = useState<
    AppliedOpportunity[]
  >([]);
  const [bookedSessions, setBookedSessions] = useState<BookedSession[]>([]);
  const [bookedSessionsOwner, setBookedSessionsOwner] = useState<string | null>(
    null
  );
  const sessionOwner = userId || "guest";
  const sessionsStorageKey = userId
    ? `${LOCAL_STORAGE_KEY_SESSIONS}:${encodeURIComponent(userId)}`
    : LOCAL_STORAGE_KEY_SESSIONS;

  // Load account applications from MongoDB, retaining local-only guest data.
  useEffect(() => {
    if (status === "loading") return;
    let cancelled = false;

    const loadData = async () => {
      try {
        const savedSessions = localStorage.getItem(sessionsStorageKey);
        if (savedSessions && !cancelled) {
          const parsedSessions: unknown = JSON.parse(savedSessions);
          if (
            Array.isArray(parsedSessions) &&
            parsedSessions.every(isBookedSession)
          ) {
            setBookedSessions(parsedSessions);
          } else {
            throw new Error("Saved mentorship sessions have an invalid format.");
          }
          setBookedSessionsOwner(sessionOwner);
        } else if (!cancelled) {
          setBookedSessions([]);
          setBookedSessionsOwner(sessionOwner);
        }

        if (userId) {
          setAppliedOpportunities([]);
          const response = await fetch("/api/applications");
          const result = await response.json();
          if (!response.ok) {
            throw new Error(result.message || "Failed to load applications.");
          }
          if (!cancelled) setAppliedOpportunities(result.data);
        } else {
          const savedApps = localStorage.getItem(LOCAL_STORAGE_KEY_APPS);
          if (savedApps && !cancelled) {
            setAppliedOpportunities(JSON.parse(savedApps));
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load saved KIOH data:", error);
        }
      }
    };

    void loadData();
    return () => {
      cancelled = true;
    };
  }, [status, userId, sessionOwner, sessionsStorageKey]);

  // Keep local storage only for users who are not signed in.
  useEffect(() => {
    if (status === "loading" || userId) return;
    try {
      localStorage.setItem(
        LOCAL_STORAGE_KEY_APPS,
        JSON.stringify(appliedOpportunities)
      );
    } catch (error) {
      console.error("Failed to persist applications:", error);
    }
  }, [appliedOpportunities, status, userId]);

  // Keep local bookings isolated by account on shared browsers.
  useEffect(() => {
    if (
      status === "loading" ||
      bookedSessionsOwner !== sessionOwner
    ) {
      return;
    }
    try {
      localStorage.setItem(
        sessionsStorageKey,
        JSON.stringify(bookedSessions)
      );
    } catch (error) {
      console.error("Failed to persist booked sessions:", error);
    }
  }, [bookedSessions, bookedSessionsOwner, sessionOwner, sessionsStorageKey, status]);

  const applyToOpportunity = async (
    opportunity: Opportunity,
    documents?: ApplicationDocuments
  ) => {
    if (appliedOpportunities.some((a) => a.opportunity.id === opportunity.id)) {
      return { confirmationEmailSent: false };
    }

    if (userId) {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opportunityId: opportunity.id,
          pitchDeckKey: documents?.pitchDeck?.key,
          certificateKeys: documents?.certificates.map((file) => file.key) ?? [],
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to submit application.");
      }
      setAppliedOpportunities((prev) => [
        { ...result.data, documents },
        ...prev,
      ]);
      return { confirmationEmailSent: result.confirmationEmailSent === true };
    }

    const newApplication: AppliedOpportunity = {
      id: `app-${Date.now()}`,
      opportunity,
      appliedAt: new Date().toISOString().split("T")[0],
      statusUpdatedAt: new Date().toISOString(),
      status: "Under Review",
    };

    setAppliedOpportunities((prev) => [newApplication, ...prev]);
    return { confirmationEmailSent: false };
  };

  const hasAppliedToOpportunity = (opportunityId: string) => {
    return appliedOpportunities.some((a) => a.opportunity.id === opportunityId);
  };

  const bookMentorSession = (
    mentor: Mentor,
    day: string,
    timeSlot: string,
    topic: string
  ) => {
    const newSession: BookedSession = {
      id: `session-${Date.now()}`,
      mentor,
      day,
      timeSlot,
      topic,
      bookedAt: new Date().toISOString().split("T")[0],
      scheduledAt: getNextSessionDate(day, timeSlot),
      status: "Upcoming",
    };

    setBookedSessions((prev) => [newSession, ...prev]);
    setBookedSessionsOwner(sessionOwner);
    return newSession;
  };

  const hasBookedMentor = (mentorId: string) => {
    return (
      bookedSessionsOwner === sessionOwner &&
      bookedSessions.some((s) => s.mentor.id === mentorId)
    );
  };

  return (
    <ApplicationContext.Provider
      value={{
        appliedOpportunities,
        bookedSessions:
          bookedSessionsOwner === sessionOwner ? bookedSessions : [],
        applyToOpportunity,
        hasAppliedToOpportunity,
        bookMentorSession,
        hasBookedMentor,
      }}
    >
      {children}
    </ApplicationContext.Provider>
  );
};

export const useApplications = () => {
  const context = useContext(ApplicationContext);
  if (!context) {
    throw new Error(
      "useApplications must be used within an ApplicationProvider"
    );
  }
  return context;
};