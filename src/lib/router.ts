import { useEffect, useState } from 'react';

export type Route = '/' | '/setup' | '/unlock' | '/recovery';
const ROUTES: Route[] = ['/', '/setup', '/unlock', '/recovery'];

const current = (): Route => {
  const path = location.hash.replace(/^#/, '') || '/';
  return (ROUTES as string[]).includes(path) ? (path as Route) : '/';
};

export function useRoute(): Route {
  const [route, setRoute] = useState(current);
  useEffect(() => {
    const onChange = () => {
      setRoute(current());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export const go = (route: Route) => {
  location.hash = route;
};
