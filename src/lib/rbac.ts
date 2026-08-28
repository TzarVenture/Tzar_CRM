import { UserRole } from "@/models/User";

export interface RolePermissions {
  canViewDashboard: boolean;
  canViewPipeline: boolean;
  canViewClients: boolean;
  canViewMetaAds: boolean;
  canViewReports: boolean;
  canViewFinancials: boolean;
  canEditStage: boolean;
  canLogNotes: boolean;
  canCreateLeads: boolean;
  canDeleteLeads: boolean;
  canBulkDelete: boolean;
  canManageTeam: boolean;
  canManageSettings: boolean;
}

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  SUPER_ADMIN: {
    canViewDashboard: true,
    canViewPipeline: true,
    canViewClients: true,
    canViewMetaAds: true,
    canViewReports: true,
    canViewFinancials: true,
    canEditStage: true,
    canLogNotes: true,
    canCreateLeads: true,
    canDeleteLeads: true,
    canBulkDelete: true,
    canManageTeam: true,
    canManageSettings: true,
  },
  SALES_MANAGER: {
    canViewDashboard: true,
    canViewPipeline: true,
    canViewClients: true,
    canViewMetaAds: true,
    canViewReports: true,
    canViewFinancials: true,
    canEditStage: true,
    canLogNotes: true,
    canCreateLeads: true,
    canDeleteLeads: false,
    canBulkDelete: false,
    canManageTeam: false,
    canManageSettings: true,
  },
  BDE: {
    canViewDashboard: true,
    canViewPipeline: true,
    canViewClients: true,
    canViewMetaAds: false,
    canViewReports: false,
    canViewFinancials: false,
    canEditStage: true,
    canLogNotes: true,
    canCreateLeads: true,
    canDeleteLeads: false,
    canBulkDelete: false,
    canManageTeam: false,
    canManageSettings: false,
  },
  MEDIA_BUYER: {
    canViewDashboard: true,
    canViewPipeline: true,
    canViewClients: false,
    canViewMetaAds: true,
    canViewReports: true,
    canViewFinancials: false,
    canEditStage: false,
    canLogNotes: true,
    canCreateLeads: false,
    canDeleteLeads: false,
    canBulkDelete: false,
    canManageTeam: false,
    canManageSettings: false,
  },
  ACCOUNT_MANAGER: {
    canViewDashboard: true,
    canViewPipeline: true,
    canViewClients: true,
    canViewMetaAds: true,
    canViewReports: true,
    canViewFinancials: true,
    canEditStage: true,
    canLogNotes: true,
    canCreateLeads: true,
    canDeleteLeads: false,
    canBulkDelete: false,
    canManageTeam: false,
    canManageSettings: false,
  },
  CLIENT: {
    canViewDashboard: true,
    canViewPipeline: false,
    canViewClients: false,
    canViewMetaAds: false,
    canViewReports: false,
    canViewFinancials: false,
    canEditStage: false,
    canLogNotes: false,
    canCreateLeads: false,
    canDeleteLeads: false,
    canBulkDelete: false,
    canManageTeam: false,
    canManageSettings: false,
  },
};

export function hasPermission(
  role: UserRole,
  permission: keyof RolePermissions
): boolean {
  const roleRules = DEFAULT_ROLE_PERMISSIONS[role] || DEFAULT_ROLE_PERMISSIONS.BDE;
  return !!roleRules[permission];
}
