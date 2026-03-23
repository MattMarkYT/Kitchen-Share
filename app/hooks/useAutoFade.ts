import { useEffect } from 'react';

export function useAutoFade(
    value: string,
    setter: (val: string) => void,
    delay = 3000
) {
    useEffect(() => {
        if (!value) return;
        const timer = setTimeout(() => setter(''), delay);
        return () => clearTimeout(timer);
    }, [value, setter, delay]);
}
