import Entity from './entity'

export default class Tenant extends Entity<number> {
    tenancyName:string | undefined;
    name:string | undefined;
    isActive:boolean | undefined;
    adminEmailAddress:string | undefined;
    connectionString:string | undefined;
}
