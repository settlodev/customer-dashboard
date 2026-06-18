"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from "react";
import { useSession } from "next-auth/react";

import { OwnerNotification } from "@/types/notification";
import {
  getUnreadCount,
  listNotifications,
  markRead as markReadAction,
  markAllRead as markAllReadAction,
} from "@/lib/actions/notification-actions";

interface NotificationState {
  unreadCount: number;
  items: OwnerNotification[];
  loading: boolean;
  open: boolean;
}

type Action =
  | { type: "SET_COUNT"; count: number }
  | { type: "SET_ITEMS"; items: OwnerNotification[] }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_OPEN"; open: boolean }
  | { type: "MARK_ONE"; id: string }
  | { type: "MARK_ALL" };

const initialState: NotificationState = {
  unreadCount: 0,
  items: [],
  loading: false,
  open: false,
};

function reducer(state: NotificationState, action: Action): NotificationState {
  switch (action.type) {
    case "SET_COUNT":
      return { ...state, unreadCount: Math.max(0, action.count) };
    case "SET_ITEMS":
      return { ...state, items: action.items };
    case "SET_LOADING":
      return { ...state, loading: action.loading };
    case "SET_OPEN":
      return { ...state, open: action.open };
    case "MARK_ONE": {
      const wasUnread = state.items.some((n) => n.id === action.id && !n.read);
      return {
        ...state,
        items: state.items.map((n) =>
          n.id === action.id ? { ...n, read: true } : n,
        ),
        unreadCount: Math.max(0, state.unreadCount - (wasUnread ? 1 : 0)),
      };
    }
    case "MARK_ALL":
      return {
        ...state,
        items: state.items.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      };
    default:
      return state;
  }
}

interface NotificationContextType extends NotificationState {
  setOpen: (open: boolean) => void;
  refreshCount: () => Promise<void>;
  loadList: () => Promise<void>;
  markOneRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  applyIncoming: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { status } = useSession();

  const refreshCount = useCallback(async () => {
    const count = await getUnreadCount();
    dispatch({ type: "SET_COUNT", count });
  }, []);

  const loadList = useCallback(async () => {
    dispatch({ type: "SET_LOADING", loading: true });
    const res = await listNotifications(0, 20);
    dispatch({ type: "SET_ITEMS", items: res.content ?? [] });
    dispatch({ type: "SET_LOADING", loading: false });
  }, []);

  const setOpen = useCallback(
    (open: boolean) => dispatch({ type: "SET_OPEN", open }),
    [],
  );

  const markOneRead = useCallback(
    async (id: string) => {
      dispatch({ type: "MARK_ONE", id });
      const { ok } = await markReadAction(id);
      if (!ok) await refreshCount();
    },
    [refreshCount],
  );

  const markAllRead = useCallback(async () => {
    dispatch({ type: "MARK_ALL" });
    const { ok } = await markAllReadAction();
    if (!ok) await refreshCount();
  }, [refreshCount]);

  const applyIncoming = useCallback(() => {
    void refreshCount();
    if (state.open) void loadList();
  }, [refreshCount, loadList, state.open]);

  useEffect(() => {
    if (status === "authenticated") void refreshCount();
  }, [status, refreshCount]);

  return (
    <NotificationContext.Provider
      value={{
        ...state,
        setOpen,
        refreshCount,
        loadList,
        markOneRead,
        markAllRead,
        applyIncoming,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return ctx;
};
