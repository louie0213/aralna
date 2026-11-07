// this file animates route changes inside the app shell
import { useLayoutEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

function getRouteOrder(pathname) {
  if (pathname === '/app') return 0;
  if (pathname === '/app/upload') return 1;
  if (pathname === '/app/reviewers') return 2;
  if (pathname.startsWith('/app/reviewers/')) return 3;
  if (pathname === '/admin') return 0;
  if (pathname === '/admin/users') return 1;
  if (pathname === '/admin/files') return 2;
  if (pathname === '/admin/admins/new') return 3;
  return -1;
}

export default function RouteTransition() {
  const { pathname } = useLocation();
  const previousPath = useRef(pathname);
  const previousOrder = getRouteOrder(previousPath.current);
  const currentOrder = getRouteOrder(pathname);
  const direction = currentOrder >= 0 && previousOrder >= 0 && currentOrder < previousOrder
    ? 'route-transition-back'
    : 'route-transition-forward';
  const isAuthRoute = pathname === '/login' || pathname === '/register';
  const isAuthRouteSwitch = isAuthRoute
    && previousPath.current !== pathname
    && (previousPath.current === '/login' || previousPath.current === '/register');

  useLayoutEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    previousPath.current = pathname;
  }, [pathname]);

  return (
    <div className={`route-transition ${direction}${isAuthRoute ? ' route-transition-auth' : ''}${isAuthRouteSwitch ? ' route-transition-auth-switch' : ''}`} key={pathname}>
      <Outlet />
    </div>
  );
}
