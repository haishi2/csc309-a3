import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ResetTokenState {
  tokens: Record<string, string>; // Maps utorid to token
  addToken: (utorid: string, token: string) => void;
  getToken: (utorid: string) => string | undefined;
  removeToken: (utorid: string) => void;
}

export const useResetTokenStore = create<ResetTokenState>()(
  persist(
    (set, get) => ({
      tokens: {},
      addToken: (utorid: string, token: string) => 
        set((state) => ({ 
          tokens: { ...state.tokens, [utorid]: token } 
        })),
      getToken: (utorid: string) => get().tokens[utorid],
      removeToken: (utorid: string) => 
        set((state) => {
          const { [utorid]: _, ...rest } = state.tokens;
          return { tokens: rest };
        }),
    }),
    {
      name: 'reset-tokens-storage',
    }
  )
); 