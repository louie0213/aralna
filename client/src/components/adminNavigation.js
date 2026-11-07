// this file lists admin sidebar navigation items and icons
export const ADMIN_NAV_ITEMS = [
  { label: 'Overview', icon: 'overview', path: '/admin', end: true, roles: ['super_admin', 'admin'] },
  { label: 'Users', icon: 'users', path: '/admin/users', roles: ['super_admin', 'admin'] },
  { label: 'Files', icon: 'files', path: '/admin/files', roles: ['super_admin', 'admin'] },
  { label: 'Quizzes', icon: 'quizzes', path: '/admin/quizzes', roles: ['super_admin', 'admin'] },
  { label: 'Add admin', icon: 'addAdmin', path: '/admin/admins/new', roles: ['super_admin'] },
];

export const STUDENT_APP_NAV_ITEM = {
  label: 'Student app',
  icon: 'studentApp',
  path: '/app',
  roles: ['super_admin', 'admin'],
};
