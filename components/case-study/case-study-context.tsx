"use client";

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from "react";
import type { TimelineItem, CaseStudySection, ProjectMetadata } from "@/types";
import { CASE_STUDY_SECTIONS } from "@/types";
import { generateCaseStudyHTML } from "@/lib/case-study-generator";

type CaseStudyAction =
  | { type: "ADD_TO_SECTION"; section: CaseStudySection; id: string; item: TimelineItem }
  | { type: "REMOVE_FROM_SECTION"; section: CaseStudySection; id: string }
  | { type: "CLEAR_SECTION"; section: CaseStudySection }
  | { type: "GENERATE"; project: ProjectMetadata }
  | { type: "CLEAR_ALL" };

interface SectionItems {
  ids: string[];
  items: Map<string, TimelineItem>;
}

interface CaseStudyState {
  sections: Map<CaseStudySection, SectionItems>;
  generatedHtml: string | null;
  allItemIds: Set<string>;
}

interface CaseStudyContextValue {
  state: CaseStudyState;
  addToSection: (section: CaseStudySection, id: string, item: TimelineItem) => void;
  removeFromSection: (section: CaseStudySection, id: string) => void;
  clearSection: (section: CaseStudySection) => void;
  getSectionItems: (section: CaseStudySection) => TimelineItem[];
  getSectionItemIds: (section: CaseStudySection) => string[];
  isItemUsed: (id: string) => boolean;
  getItemSection: (id: string) => CaseStudySection | null;
  generate: (project: ProjectMetadata) => void;
  clearAll: () => void;
  getTotalItemCount: () => number;
}

const CaseStudyContext = createContext<CaseStudyContextValue | null>(null);

function createInitialSections(): Map<CaseStudySection, SectionItems> {
  const sections = new Map<CaseStudySection, SectionItems>();
  for (const section of CASE_STUDY_SECTIONS) {
    sections.set(section, { ids: [], items: new Map() });
  }
  return sections;
}

function caseStudyReducer(
  state: CaseStudyState,
  action: CaseStudyAction
): CaseStudyState {
  switch (action.type) {
    case "ADD_TO_SECTION": {
      const sectionData = state.sections.get(action.section);
      if (!sectionData || sectionData.ids.includes(action.id)) return state;

      const newSections = new Map(state.sections);
      const newSectionData: SectionItems = {
        ids: [...sectionData.ids, action.id],
        items: new Map(sectionData.items),
      };
      newSectionData.items.set(action.id, action.item);
      newSections.set(action.section, newSectionData);

      const newAllItemIds = new Set(state.allItemIds);
      newAllItemIds.add(action.id);

      return {
        ...state,
        sections: newSections,
        allItemIds: newAllItemIds,
        generatedHtml: null,
      };
    }

    case "REMOVE_FROM_SECTION": {
      const sectionData = state.sections.get(action.section);
      if (!sectionData || !sectionData.ids.includes(action.id)) return state;

      const newSections = new Map(state.sections);
      const newSectionData: SectionItems = {
        ids: sectionData.ids.filter((id) => id !== action.id),
        items: new Map(sectionData.items),
      };
      newSectionData.items.delete(action.id);
      newSections.set(action.section, newSectionData);

      const newAllItemIds = new Set(state.allItemIds);
      newAllItemIds.delete(action.id);

      return {
        ...state,
        sections: newSections,
        allItemIds: newAllItemIds,
        generatedHtml: null,
      };
    }

    case "CLEAR_SECTION": {
      const sectionData = state.sections.get(action.section);
      if (!sectionData || sectionData.ids.length === 0) return state;

      const newSections = new Map(state.sections);
      newSections.set(action.section, { ids: [], items: new Map() });

      const newAllItemIds = new Set(state.allItemIds);
      for (const id of sectionData.ids) {
        newAllItemIds.delete(id);
      }

      return {
        ...state,
        sections: newSections,
        allItemIds: newAllItemIds,
        generatedHtml: null,
      };
    }

    case "GENERATE": {
      const sectionItemsMap = new Map<CaseStudySection, TimelineItem[]>();
      for (const section of CASE_STUDY_SECTIONS) {
        const sectionData = state.sections.get(section);
        if (sectionData) {
          const items = sectionData.ids
            .map((id) => sectionData.items.get(id))
            .filter((item): item is TimelineItem => item !== undefined);
          sectionItemsMap.set(section, items);
        }
      }

      const html = generateCaseStudyHTML(action.project, sectionItemsMap);
      return {
        ...state,
        generatedHtml: html,
      };
    }

    case "CLEAR_ALL": {
      return {
        sections: createInitialSections(),
        generatedHtml: null,
        allItemIds: new Set(),
      };
    }

    default:
      return state;
  }
}

const initialState: CaseStudyState = {
  sections: createInitialSections(),
  generatedHtml: null,
  allItemIds: new Set(),
};

export function CaseStudyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(caseStudyReducer, initialState);

  const addToSection = useCallback(
    (section: CaseStudySection, id: string, item: TimelineItem) => {
      dispatch({ type: "ADD_TO_SECTION", section, id, item });
    },
    []
  );

  const removeFromSection = useCallback(
    (section: CaseStudySection, id: string) => {
      dispatch({ type: "REMOVE_FROM_SECTION", section, id });
    },
    []
  );

  const clearSection = useCallback((section: CaseStudySection) => {
    dispatch({ type: "CLEAR_SECTION", section });
  }, []);

  const getSectionItems = useCallback(
    (section: CaseStudySection): TimelineItem[] => {
      const sectionData = state.sections.get(section);
      if (!sectionData) return [];
      return sectionData.ids
        .map((id) => sectionData.items.get(id))
        .filter((item): item is TimelineItem => item !== undefined);
    },
    [state.sections]
  );

  const getSectionItemIds = useCallback(
    (section: CaseStudySection): string[] => {
      const sectionData = state.sections.get(section);
      return sectionData?.ids ?? [];
    },
    [state.sections]
  );

  const isItemUsed = useCallback(
    (id: string): boolean => {
      return state.allItemIds.has(id);
    },
    [state.allItemIds]
  );

  const getItemSection = useCallback(
    (id: string): CaseStudySection | null => {
      for (const section of CASE_STUDY_SECTIONS) {
        const sectionData = state.sections.get(section);
        if (sectionData?.ids.includes(id)) {
          return section;
        }
      }
      return null;
    },
    [state.sections]
  );

  const generate = useCallback((project: ProjectMetadata) => {
    dispatch({ type: "GENERATE", project });
  }, []);

  const clearAll = useCallback(() => {
    dispatch({ type: "CLEAR_ALL" });
  }, []);

  const getTotalItemCount = useCallback(() => {
    return state.allItemIds.size;
  }, [state.allItemIds]);

  return (
    <CaseStudyContext.Provider
      value={{
        state,
        addToSection,
        removeFromSection,
        clearSection,
        getSectionItems,
        getSectionItemIds,
        isItemUsed,
        getItemSection,
        generate,
        clearAll,
        getTotalItemCount,
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
