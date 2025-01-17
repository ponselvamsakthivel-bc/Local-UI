import { UserTitleEnum } from "../constants/enum";
import { PaginationInfo } from "./paginationInfo";

export interface User {
    id: number,
    userName: string;
    userGroups: UserGroup[]
    organisationId: string;
}

export interface UserGroup {
    groupId: number;
    group: string;
    accessRole: string;
    accessRoleName: string;
    serviceClientId: string;
}

export interface UserDetail {
    userName: string;
    organisationId: string;
    title: UserTitleEnum;
    firstName: string;
    lastName: string;
}

export interface UserRequestDetail {
    id: number,
    groupIds?: number[];
    roleIds?: number[];
    identityProviderId?: number;
}

export interface UserResponseDetail{
    id : number,
    identityProvider?: string;
    identityProviderDisplayName?: string;
    userGroups?: UserGroup[];
    canChangePassword: boolean;
    rolePermissionInfo?: RolePermissionInfo[];
    identityProviderId?: number;
}

export interface RolePermissionInfo {
    roleName: string;
    roleKey: string;
    roleId: number,
    serviceClientId: string;
}

export interface UserProfileRequestInfo extends UserDetail {
    detail: UserRequestDetail
}

export interface UserProfileResponseInfo extends UserDetail {    
    detail: UserResponseDetail
}

export interface UserListInfo {
    name: string;
    userName: string;
}

export interface UserListResponse extends PaginationInfo {
    organisationId: string;
    userList: UserListInfo[];
}

export interface UserEditResponseInfo {
    userId: string;
    isRegisteredInIdam: boolean;
}

export interface CheckBoxUserListGridSource extends UserListInfo {
    isChecked?: boolean;
}

export interface OrganisationUserDto {
    id: number;
    userName: string;
    name: string;
    organisationId: number;
    organisationLegalName: string;
}