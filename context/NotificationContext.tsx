"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import { useApplications } from "@/context/ApplicationContext";

export type NotificationKind = "application" | "mentor" | "session";

export interface DashboardNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  message: string;
  timestamp: string;
  link: string;
  isRead: boolean;
}

interface NotificationContextValue {
  notifications: DashboardNotification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismiss: (id: string) => void;
}

interface ApplicationNotificationSource {
  id: string;
  title: string;
  status: string;
  timestamp: string;
}

interface MentorNotificationSource {
  status: string;
  timestamp: string;
}

interface NotificationSourceData {
  userId: string;
  applications: ApplicationNotificationSource[];
  mentorApplication: MentorNotificationSource | null;
}

interface PersistedNotificationState {
  userId: string;
  readIds: string[];
  dismissedIds: string[];
}

const NotificationContext = createContext<NotificationContextValue | null>(
  null
);
const EMPTY_PERSISTED_STATE = { readIds: [], dismissedIds: [] };
const REFRESH_INTERVAL = 2 * 60 * 1000;

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const { bookedSessions } = useApplications();
  const userId = session?.user?.id ?? null;
  const storageKey = userId
    ? `kioh_notifications:${encodeURIComponent(userId)}`
    : null;
  const [sourceData, setSourceData] = useState<NotificationSourceData | null>(
    null
  );
  const [persistedState, setPersistedState] =
    useState<PersistedNotificationState | null>(null);
  const [loadState, setLoadState] = useState<{
    userId: string;
    isLoading: boolean;
    error: string | null;
  } | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;

    setLoadState({ userId, isLoading: true, error: null });
    try {
      const [applicationsResponse, mentorResponse] = await Promise.all([
        fetch("/api/applications", { cache: "no-store" }),
        fetch("/api/mentor-applications", { cache: "no-store" }),
      ]);
      const [applicationsResult, mentorResult] = await Promise.all([
        applicationsResponse.json(),
        mentorResponse.json(),
      ]);
      if (!applicationsResponse.ok) {
        throw new Error(
          applicationsResult.message || "Could not load application updates."
        );
      }
      if (!mentorResponse.ok) {
        throw new Error(
          mentorResult.message || "Could not load mentor application updates."
        );
      }

      const applications = Array.isArray(applicationsResult.data)
        ? applicationsResult.data.flatMap(
            (application: {
              id?: unknown;
              opportunity?: { title?: unknown };
              status?: unknown;
              appliedAt?: unknown;
              statusUpdatedAt?: unknown;
            }) =>
              typeof application.id === "string" &&
              typeof application.opportunity?.title === "string" &&
              typeof application.status === "string" &&
              typeof application.appliedAt === "string"
                ? [
                    {
                      id: application.id,
                      title: application.opportunity.title,
                      status: application.status,
                      timestamp:
                        typeof application.statusUpdatedAt === "string"
                          ? application.statusUpdatedAt
                          : application.appliedAt,
                    },
                  ]
                : []
          )
        : [];
      const mentorApplication =
        mentorResult.data &&
        typeof mentorResult.data.status === "string" &&
        typeof mentorResult.data.statusUpdatedAt === "string"
          ? {
              status: mentorResult.data.status,
              timestamp: mentorResult.data.statusUpdatedAt,
            }
          : null;

      setSourceData({
        userId,
        applications,
        mentorApplication,
      });
      setLoadState({ userId, isLoading: false, error: null });
    } catch (error) {
      console.error("[NOTIFICATION_REFRESH_ERROR]:", error);
      setLoadState({
        userId,
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Could not load your notifications.",
      });
    }
  }, [userId]);

  useEffect(() => {
    if (!userId || !storageKey) return;
    const timeout = window.setTimeout(() => {
      try {
        const savedState = localStorage.getItem(storageKey);
        const parsed: unknown = savedState ? JSON.parse(savedState) : null;
        if (
          parsed &&
          typeof parsed === "object" &&
          "readIds" in parsed &&
          "dismissedIds" in parsed &&
          Array.isArray(parsed.readIds) &&
          Array.isArray(parsed.dismissedIds) &&
          parsed.readIds.every((id: unknown) => typeof id === "string") &&
          parsed.dismissedIds.every((id: unknown) => typeof id === "string")
        ) {
          setPersistedState({
            userId,
            readIds: parsed.readIds,
            dismissedIds: parsed.dismissedIds,
          });
        } else {
          setPersistedState({
            userId,
            ...EMPTY_PERSISTED_STATE,
          });
        }
      } catch (error) {
        console.error("[NOTIFICATION_STORAGE_READ_ERROR]:", error);
        setPersistedState({
          userId,
          ...EMPTY_PERSISTED_STATE,
        });
      }
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [storageKey, userId]);

  useEffect(() => {
    if (!userId) return;
    const initialRefresh = window.setTimeout(() => void refresh(), 0);
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, REFRESH_INTERVAL);
    return () => {
      window.clearTimeout(initialRefresh);
      window.clearInterval(interval);
    };
  }, [refresh, userId]);

  useEffect(() => {
    if (!storageKey || persistedState?.userId !== userId) return;
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          readIds: persistedState.readIds,
          dismissedIds: persistedState.dismissedIds,
        })
      );
    } catch (error) {
      console.error("[NOTIFICATION_STORAGE_WRITE_ERROR]:", error);
    }
  }, [persistedState, storageKey, userId]);

  const activePersistedState =
    persistedState?.userId === userId
      ? persistedState
      : { userId: userId ?? "", ...EMPTY_PERSISTED_STATE };
  const notifications = useMemo(() => {
    if (!userId) return [];

    const readIds = new Set(activePersistedState.readIds);
    const dismissedIds = new Set(activePersistedState.dismissedIds);
    const events: Omit<DashboardNotification, "isRead">[] = [];

    if (sourceData?.userId === userId) {
      for (const application of sourceData.applications) {
        events.push({
          id: `application:${application.id}:${application.status}`,
          kind: "application",
          title: "Opportunity application update",
          message: `${application.title} — ${application.status}`,
          timestamp: application.timestamp,
          link: "/dashboard?tab=applications",
        });
      }

      if (sourceData.mentorApplication) {
        events.push({
          id: `mentor:${sourceData.mentorApplication.status}:${sourceData.mentorApplication.timestamp}`,
          kind: "mentor",
          title: "Navigator application update",
          message: `Your application is ${sourceData.mentorApplication.status.toLowerCase()}.`,
          timestamp: sourceData.mentorApplication.timestamp,
          link: "/dashboard",
        });
      }
    }

    for (const session of bookedSessions) {
      if (session.status !== "Upcoming") continue;
      const scheduledAt = session.scheduledAt
        ? new Date(session.scheduledAt)
        : null;
      if (!scheduledAt || Number.isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) {
        continue;
      }
      events.push({
        id: `session:${session.id}`,
        kind: "session",
        title: "Mentorship session reminder",
        message: `${session.mentor.name} — ${scheduledAt.toLocaleString([], {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })}`,
        timestamp: scheduledAt.toISOString(),
        link: "/dashboard?tab=mentorship",
      });
    }

    return events
      .filter((event) => !dismissedIds.has(event.id))
      .map((event) => ({ ...event, isRead: readIds.has(event.id) }))
      .sort(
        (left, right) =>
          new Date(right.timestamp).getTime() -
          new Date(left.timestamp).getTime()
      );
  }, [activePersistedState.readIds, activePersistedState.dismissedIds, bookedSessions, sourceData, userId]);

  const updatePersistedState = useCallback(
    (update: (state: PersistedNotificationState) => PersistedNotificationState) => {
      if (!userId) return;
      setPersistedState((previous) =>
        update(
          previous?.userId === userId
            ? previous
            : { userId, ...EMPTY_PERSISTED_STATE }
        )
      );
    },
    [userId]
  );

  const markAsRead = useCallback(
    (id: string) => {
      updatePersistedState((state) => ({
        ...state,
        readIds: [...new Set([...state.readIds, id])],
      }));
    },
    [updatePersistedState]
  );

  const markAllAsRead = useCallback(() => {
    updatePersistedState((state) => ({
      ...state,
      readIds: [
        ...new Set([...state.readIds, ...notifications.map(({ id }) => id)]),
      ],
    }));
  }, [notifications, updatePersistedState]);

  const dismiss = useCallback(
    (id: string) => {
      updatePersistedState((state) => ({
        ...state,
        dismissedIds: [...new Set([...state.dismissedIds, id])],
      }));
    },
    [updatePersistedState]
  );

  const loadStateForUser =
    loadState?.userId === userId ? loadState : null;
  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCount: notifications.filter(({ isRead }) => !isRead).length,
      isLoading: Boolean(userId && (!loadStateForUser || loadStateForUser.isLoading)),
      error: loadStateForUser?.error ?? null,
      refresh,
      markAsRead,
      markAllAsRead,
      dismiss,
    }),
    [
      dismiss,
      loadStateForUser,
      markAllAsRead,
      markAsRead,
      notifications,
      refresh,
      userId,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}
