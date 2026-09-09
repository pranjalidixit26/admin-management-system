import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Inject } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import {PERMISSION_KEY} from './require-permission.decorator';
import { Observable } from "rxjs";

@Injectable()
export class PermissionGuard implements CanActivate{
    constructor(private reflector:Reflector){}

    canActivate(context: ExecutionContext): boolean {
        const requiredPermission=this.reflector.get<string>(
            PERMISSION_KEY,
            context.getHandler(),
        );

        if(!requiredPermission){
            return true;
        }

        const request=context.switchToHttp().getRequest();
        const user=request.user;

        if(!user?.permissions?.includes(requiredPermission)){
            throw new ForbiddenException(
                `You do not have the required permission:${requiredPermission}`,
            );
        }
        return true;
    }
}