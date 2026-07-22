import { createContext, useContext, type Context, type Provider } from "react";

export function getStrictContext<T>(name: string): { Context: Context<T | undefined>; Provider: Provider<T>; useValue: () => T } {
  const Context = createContext<T | undefined>(undefined);
  const useValue = () => {
    const value = useContext(Context);
    if (value === undefined) throw new Error(`${name} must be used within its provider`);
    return value;
  };
  return { Context, Provider: Context.Provider, useValue };
}
