export const normalizeUserRole = (role?: string | null) =>
  String(role ?? '').trim().toLowerCase()

export const isOwnerRole = (role?: string | null) => normalizeUserRole(role) === 'owner'

export const isTrainerRole = (role?: string | null) => normalizeUserRole(role) === 'trainer'

export const isMemberRole = (role?: string | null) => normalizeUserRole(role) === 'member'

export const isStaffRole = (role?: string | null) => isOwnerRole(role) || isTrainerRole(role)

export const canAccessMemberManagement = (role?: string | null) => isStaffRole(role)

export const canAccessStaffManagement = (role?: string | null) => isStaffRole(role)

export const canAccessAddMember = (role?: string | null) => isStaffRole(role)

// Keep Add Staff aligned with the current backend behavior:
// owners and trainers can create trainer/member accounts for now.
export const canAccessAddStaff = (role?: string | null) => isStaffRole(role)
