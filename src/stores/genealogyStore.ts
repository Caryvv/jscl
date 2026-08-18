import { create } from 'zustand';
import { GenealogyEntry } from '@/types/genealogy';
import { FamilyMember } from '@/types/member';
import { createGenealogyEntry } from '@/services/genealogyService';
import { getStorage, setStorage } from '@/utils/storage';

interface GenealogyState {
  entries: GenealogyEntry[];

  init: () => void;
  /** 归档一位去世成员到族谱 */
  archiveMember: (member: FamilyMember, dynastyName: string) => void;
  save: () => void;
}

export const useGenealogyStore = create<GenealogyState>((set, get) => ({
  entries: [],

  init: () => {
    const saved = getStorage<GenealogyEntry[]>('genealogyState', []);
    if (saved) set({ entries: saved });
  },

  archiveMember: (member, dynastyName) => {
    // 避免重复归档
    if (get().entries.some(e => e.memberId === member.id)) return;
    const entry = createGenealogyEntry(member, dynastyName);
    set({ entries: [...get().entries, entry] });
    get().save();
  },

  save: () => {
    setStorage('genealogyState', get().entries);
  },
}));
