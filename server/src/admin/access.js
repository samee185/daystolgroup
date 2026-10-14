/** Role checks for AdminJS. `currentAdmin` is the object returned by authenticate(). */

export const hasRole = (currentAdmin, ...allowed) =>
  Array.isArray(currentAdmin?.roles) && currentAdmin.roles.some((r) => allowed.includes(r))

const can = (...roles) => ({ currentAdmin }) => hasRole(currentAdmin, ...roles)

/**
 * Build the AdminJS `actions` access map for a resource.
 * read: who can list and view; write: who can create and edit; remove: who can delete.
 */
export function accessFor({ read, write, remove }) {
  return {
    list: { isAccessible: can(...read) },
    show: { isAccessible: can(...read) },
    search: { isAccessible: can(...read) },
    new: { isAccessible: can(...write) },
    edit: { isAccessible: can(...write) },
    delete: { isAccessible: can(...remove) },
    bulkDelete: { isAccessible: can(...remove) },
  }
}

export const ALL_STAFF = ['admin', 'editor', 'sales', 'support']
