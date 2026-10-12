"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  BellIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useNotifications } from "@/context/NotificationContext";

function formatNotificationTime(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function NotificationMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, isLoading, error, markAsRead, markAllAsRead } =
    useNotifications();

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (
        event.target instanceof Node &&
        !menuRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("mousedown", closeOnOutsideClick);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={() => setIsOpen((open) => !open)}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-teal-100 transition hover:border-teal-300/30 hover:bg-teal-300/10"
      >
        <BellIcon aria-hidden="true" className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-slate-950 bg-teal-300 px-1 text-[10px] font-extrabold text-slate-950">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 z-50 mt-3 w-[min(24rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/40"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <h2 className="text-sm font-bold text-white">Notifications</h2>
              <p className="mt-0.5 text-[11px] text-slate-400">
                {unreadCount ? `${unreadCount} unread` : "You’re up to date"}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="min-h-10 rounded-lg px-2 text-[11px] font-semibold text-teal-200 hover:bg-white/5"
                >
                  Mark all read
                </button>
              )}
              <button
                type="button"
                aria-label="Close notifications"
                onClick={() => setIsOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 hover:bg-white/5 hover:text-white"
              >
                <XMarkIcon aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="px-4 py-3 text-xs text-amber-200">
              {error}
            </p>
          )}
          {isLoading && notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-slate-400">
              Loading notifications…
            </p>
          ) : notifications.length > 0 ? (
            <ul className="max-h-[min(60vh,26rem)] divide-y divide-white/5 overflow-y-auto">
              {notifications.slice(0, 6).map((notification) => (
                <li key={notification.id}>
                  <Link
                    href={notification.link}
                    onClick={() => {
                      markAsRead(notification.id);
                      setIsOpen(false);
                    }}
                    className={`block px-4 py-3 transition hover:bg-white/5 ${
                      notification.isRead ? "" : "bg-teal-300/[0.04]"
                    }`}
                  >
                    <span className="flex items-start gap-3">
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                          notification.isRead ? "bg-slate-600" : "bg-teal-300"
                        }`}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-semibold text-white">
                          {notification.title}
                        </span>
                        <span className="mt-1 block text-xs leading-relaxed text-slate-300">
                          {notification.message}
                        </span>
                        <span className="mt-1.5 block text-[10px] text-slate-400">
                          {formatNotificationTime(notification.timestamp)}
                        </span>
                      </span>
                      {notification.isRead && (
                        <CheckIcon
                          aria-label="Read"
                          className="h-4 w-4 shrink-0 text-teal-300"
                        />
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-5 py-8 text-center">
              <BellIcon
                aria-hidden="true"
                className="mx-auto h-7 w-7 text-slate-600"
              />
              <p className="mt-3 text-xs font-semibold text-slate-300">
                No notifications yet
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                Application updates and booked session reminders will appear here.
              </p>
            </div>
          )}

          <div className="border-t border-white/10 p-2">
            <Link
              href="/dashboard?tab=notifications"
              onClick={() => setIsOpen(false)}
              className="flex min-h-10 items-center justify-center rounded-lg text-xs font-semibold text-teal-200 transition hover:bg-white/5"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
