import Entity from './entity'

export default class Role extends Entity<number> {
    name:string | undefined;
    displayName:string | undefined;
    normalizedName:string | undefined;
    description:string | undefined;
    grantedPermissions:string[] | undefined
}
