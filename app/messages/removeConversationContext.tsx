import {createContext} from "react";

export const RemoveConversationContext = createContext<(id: string) => void>(() => {
});