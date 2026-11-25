import { useEffect } from 'react';

/** Set the browser tab title for a page: "Live map · Turnly". */
export function useTitle(title: string | null | undefined) {
  useEffect(() => {
    if (title === undefined || title === null) return;
    document.title = title ? `${title} · Turnly` : 'Turnly · Skip every line, wait anywhere';
  }, [title]);
}
