"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowPathIcon,
  BellIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useNotifications } from "@/context/NotificationContext";

type NotificationFilter = "all" | "unread";

function formatNotificationTime(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function NotificationActivity() {
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    refresh,
    markAsRead,
    markAllAsRead,
    dismiss,
  } = useNotifications();
  const visibleNotifications =
    filter === "unread"
      ? notifications.filter(({ isRead }) => !isRead)
      : notifications;

  return (
    <section className="mt-8 space-y-5" aria-labelledby="notification-activity-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2
            id="notification-activity-title"
            className="text-2xl font-bold text-white"
          >
            Activity &amp; Notifications
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
            Application progress and upcoming mentorship bookings, gathered from
            your account.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={isLoading}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 text-xs font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-wait disabled:opacity-50"
          >
            <ArrowPathIcon
              aria-hidden="true"
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="min-h-11 rounded-xl border border-teal-300/20 bg-teal-300/10 px-3.5 text-xs font-semibold text-teal-100 transition hover:bg-teal-300/15"
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex gap-2" aria-label="Filter notifications">
          {(["all", "unread"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={filter === option}
              onClick={() => setFilter(option)}
              className={`min-h-10 rounded-xl px-3.5 text-xs font-semibold capitalize transition ${
                filter === option
                  ? "bg-teal-300/15 text-teal-100"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {option === "all" ? `All (${notifications.length})` : `Unread (${unreadCount})`}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-slate-400">
          Updates refresh automatically while this page is open.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] px-4 py-3"
        >
          <p className="text-xs leading-relaxed text-amber-100">{error}</p>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={isLoading}
            className="min-h-10 rounded-lg px-3 text-xs font-semibold text-amber-100 hover:bg-amber-200/10 disabled:opacity-50"
          >
            Try again
          </button>
        </div>
      )}

      {isLoading && notifications.length === 0 ? (
        <div
          role="status"
          className="rounded-3xl border border-white/10 bg-slate-900/50 px-6 py-12 text-center"
        >
          <span className="mx-auto block h-6 w-6 animate-spin rounded-full border-2 border-teal-300/30 border-t-teal-200" />
          <p className="mt-4 text-sm text-slate-300">Loading your activity…</p>
        </div>
      ) : visibleNotifications.length > 0 ? (
        <ul className="space-y-3">
          {visibleNotifications.map((notification) => (
            <li
              key={notification.id}
              className={`flex items-start gap-3 rounded-2xl border p-4 transition sm:gap-4 sm:p-5 ${
                notification.isRead
                  ? "border-white/10 bg-slate-900/50"
                  : "border-teal-300/20 bg-teal-300/[0.04]"
              }`}
            >
              <span
                className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  notification.kind === "session"
                    ? "bg-indigo-300/10 text-indigo-200"
                    : notification.kind === "mentor"
                      ? "bg-amber-300/10 text-amber-200"
                      : "bg-teal-300/10 text-teal-200"
                }`}
              >
                <BellIcon aria-hidden="true" className="h-5 w-5" />
              </span>
              <Link
                href={notification.link}
                onClick={() => markAsRead(notification.id)}
                className="min-w-0 flex-1 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-200"
              >
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-white">
                    {notification.title}
                  </span>
                  {!notification.isRead && (
                    <span className="rounded-full bg-teal-300/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal-100">
                      New
                    </span>
                  )}
                </span>
                <span className="mt-1.5 block text-sm leading-relaxed text-slate-300">
                  {notification.message}
                </span>
                <span className="mt-2 block text-[11px] text-slate-400">
                  {formatNotificationTime(notification.timestamp)}
                </span>
              </Link>
              <div className="flex shrink-0 items-center gap-1">
                {!notification.isRead && (
                  <button
                    type="button"
                    aria-label={`Mark ${notification.title} as read`}
                    onClick={() => markAsRead(notification.id)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-teal-100"
                  >
                    <CheckIcon aria-hidden="true" className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  aria-label={`Dismiss ${notification.title}`}
                  onClick={() => dismiss(notification.id)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/5 hover:text-white"
                >
                  <XMarkIcon aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-3xl border border-dashed border-white/10 bg-slate-900/30 px-6 py-12 text-center">
          <BellIcon
            aria-hidden="true"
            className="mx-auto h-8 w-8 text-slate-500"
          />
          <h3 className="mt-4 text-sm font-semibold text-white">
            {filter === "unread" ? "You’re all caught up" : "Nothing to report yet"}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-slate-400">
            {filter === "unread"
              ? "New application updates and session bookings will appear here."
              : "Once you apply for an opportunity or book a mentorship session, updates will appear here."}
          </p>
          {filter === "unread" && notifications.length > 0 && (
            <button
              type="button"
              onClick={() => setFilter("all")}
              className="mt-4 min-h-10 rounded-lg px-3 text-xs font-semibold text-teal-200 hover:bg-white/5"
            >
              Show all activity
            </button>
          )}
        </div>
      )}
    </section>
  );
}
