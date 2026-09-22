import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../auth/permission.guard';
import { RequirePermission } from '../auth/require-permission.decorator';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
    constructor(private dashboardService: DashboardService) {}

    @Get('stats')
    @UseGuards(JwtAuthGuard, PermissionGuard)
    @RequirePermission('DASHBOARD_VIEW')
    getStats() {
        return this.dashboardService.getStats();
    }
}