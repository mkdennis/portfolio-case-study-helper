"use client";

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from "react";
import type { TimelineItem } from "@/types";

type CaseStudyAction =
  | { type: "SELECT"; id: string; item: TimelineItem }
  | { type: "DESELECT"; id: string }
  | { type: "TOGGLE"; id: string; item: TimelineItem }
  | { type: "SELECT_ALL"; items: Array<{ id: string; item: TimelineItem }> }
  | { type: "CLEAR" };

interface CaseStudyState {
  selectedIds: Set<string>;
  orderedIds: string[];
  itemsMap: Map<string, TimelineItem>;
}

interface CaseStudyContextValue {
  state: CaseStudyState;
  isSelected: (id: string) => boolean;
  select: (id: string, item: TimelineItem) => void;
  deselect: (id: string) => void;
  toggle: (id: string, item: TimelineItem) => void;
  selectAll: (items: Array<{ id: string; item: TimelineItem }>) => void;
  clear: () => void;
  getOrderedItems: () => TimelineItem[];
  getSelectionOrder: (id: string) => number;
}

const CaseStudyContext = createContext<CaseStudyContextValue | null>(null);

function caseStudyReducer(
  state: CaseStudyState,
  action: CaseStudyAction
): CaseStudyState {
  switch (action.type) {
    case "SELECT": {
      if (state.selectedIds.has(action.id)) return state;
      const newSelectedIds = new Set(state.selectedIds);
      newSelectedIds.add(action.id);
      const newItemsMap = new Map(state.itemsMap);
      newItemsMap.set(action.id, action.item);
      return {
        selectedIds: newSelectedIds,
        orderedIds: [...state.orderedIds, action.id],
        itemsMap: newItemsMap,
      };
    }

    case "DESELECT": {
      if (!state.selectedIds.has(action.id)) return state;
      const newSelectedIds = new Set(state.selectedIds);
      newSelectedIds.delete(action.id);
      const newItemsMap = new Map(state.itemsMap);
      newItemsMap.delete(action.id);
      return {
        selectedIds: newSelectedIds,
        orderedIds: state.orderedIds.filter((id) => id !== action.id),
        itemsMap: newItemsMap,
      };
    }

    case "TOGGLE": {
      if (state.selectedIds.has(action.id)) {
        return caseStudyReducer(state, { type: "DESELECT", id: action.id });
      }
      return caseStudyReducer(state, {
        type: "SELECT",
        id: action.id,
        item: action.item,
      });
    }

    case "SELECT_ALL": {
      const newSelectedIds = new Set<string>();
      const newOrderedIds: string[] = [];
      const newItemsMap = new Map<string, TimelineItem>();

      for (const { id, item } of action.items) {
        newSelectedIds.add(id);
        newOrderedIds.push(id);
        newItemsMap.set(id, item);
      }

      return {
        selectedIds: newSelectedIds,
        orderedIds: newOrderedIds,
        itemsMap: newItemsMap,
      };
    }

    case "CLEAR": {
      return {
        selectedIds: new Set(),
        orderedIds: [],
        itemsMap: new Map(),
      };
    }

    default:
      return state;
  }
}

const initialState: CaseStudyState = {
  selectedIds: new Set(),
  orderedIds: [],
  itemsMap: new Map(),
};

export function CaseStudyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(caseStudyReducer, initialState);

  const isSelected = useCallback(
    (id: string) => state.selectedIds.has(id),
    [state.selectedIds]
  );

  const select = useCallback((id: string, item: TimelineItem) => {
    dispatch({ type: "SELECT", id, item });
  }, []);

  const deselect = useCallback((id: string) => {
    dispatch({ type: "DESELECT", id });
  }, []);

  const toggle = useCallback((id: string, item: TimelineItem) => {
    dispatch({ type: "TOGGLE", id, item });
  }, []);

  const selectAll = useCallback(
    (items: Array<{ id: string; item: TimelineItem }>) => {
      dispatch({ type: "SELECT_ALL", items });
    },
    []
  );

  const clear = useCallback(() => {
    dispatch({ type: "CLEAR" });
  }, []);

  const getOrderedItems = useCallback(() => {
    return state.orderedIds
      .map((id) => state.itemsMap.get(id))
      .filter((item): item is TimelineItem => item !== undefined);
  }, [state.orderedIds, state.itemsMap]);

  const getSelectionOrder = useCallback(
    (id: string) => {
      const index = state.orderedIds.indexOf(id);
      return index === -1 ? -1 : index + 1;
    },
    [state.orderedIds]
  );

  return (
    <CaseStudyContext.Provider
      value={{
        state,
        isSelected,
        select,
        deselect,
        toggle,
        selectAll,
        clear,
        getOrderedItems,
        getSelectionOrder,
      }}
    >
      {children}
    </CaseStudyContext.Provider>
  );
}

export function useCaseStudy() {
  const context = useContext(CaseStudyContext);
  if (!context) {
    throw new Error("useCaseStudy must be used within a CaseStudyProvider");
  }
  return context;
}
