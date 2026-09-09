export function hasPermission(code:string): boolean{
    const stored=localStorage.getItem('permissions');
    if(!stored) return false;

    const permissions:string[]=JSON.parse(stored);
    return permissions.includes(code);
}