import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OrganizationsService } from './services/organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { ApproveEntryDto, RejectEntryDto } from './dto/approve-entry.dto';
import { CreateTaxReportDto } from './dto/create-tax-report.dto';

@ApiTags('organizations')
@ApiBearerAuth()
@Controller('api/v1/organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private organizationsService: OrganizationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new organization' })
  @ApiResponse({ status: 201, description: 'Organization created successfully' })
  async createOrganization(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateOrganizationDto,
  ) {
    return this.organizationsService.createOrganization(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all organizations where user is a member' })
  @ApiResponse({ status: 200, description: 'Returns list of organizations' })
  async getOrganizations(@CurrentUser('id') userId: string) {
    return this.organizationsService.getOrganizations(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization details' })
  @ApiResponse({ status: 200, description: 'Returns organization details' })
  async getOrganization(
    @CurrentUser('id') userId: string,
    @Param('id') orgId: string,
  ) {
    return this.organizationsService.getOrganization(userId, orgId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update organization (Admin only)' })
  @ApiResponse({ status: 200, description: 'Organization updated successfully' })
  async updateOrganization(
    @CurrentUser('id') userId: string,
    @Param('id') orgId: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.updateOrganization(userId, orgId, dto);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Invite a member to the organization' })
  @ApiResponse({ status: 201, description: 'Member invited successfully' })
  async inviteMember(
    @CurrentUser('id') userId: string,
    @Param('id') orgId: string,
    @Body() dto: InviteMemberDto,
  ) {
    return this.organizationsService.inviteMember(userId, orgId, dto);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remove a member from the organization (Admin only)' })
  @ApiResponse({ status: 200, description: 'Member removed successfully' })
  async removeMember(
    @CurrentUser('id') userId: string,
    @Param('id') orgId: string,
    @Param('userId') targetUserId: string,
  ) {
    return this.organizationsService.removeMember(userId, orgId, targetUserId);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get all members of the organization' })
  @ApiResponse({ status: 200, description: 'Returns list of members' })
  async getMembers(
    @CurrentUser('id') userId: string,
    @Param('id') orgId: string,
  ) {
    return this.organizationsService.getMembers(userId, orgId);
  }

  @Get(':id/ledger')
  @ApiOperation({ summary: 'Get consolidated ledger entries' })
  @ApiResponse({ status: 200, description: 'Returns ledger entries' })
  async getLedger(
    @CurrentUser('id') userId: string,
    @Param('id') orgId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('memberId') memberId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('status') status?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.organizationsService.getLedger(userId, orgId, {
      startDate,
      endDate,
      memberId,
      categoryId,
      status,
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
    });
  }

  @Get(':id/ledger/summary')
  @ApiOperation({ summary: 'Get aggregated ledger summary' })
  @ApiResponse({ status: 200, description: 'Returns summary statistics' })
  async getLedgerSummary(
    @CurrentUser('id') userId: string,
    @Param('id') orgId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.organizationsService.getLedgerSummary(userId, orgId, {
      startDate,
      endDate,
    });
  }

  @Put(':id/ledger/:entryId/approve')
  @ApiOperation({ summary: 'Approve a ledger entry (Admin/Accountant only)' })
  @ApiResponse({ status: 200, description: 'Entry approved successfully' })
  async approveEntry(
    @CurrentUser('id') userId: string,
    @Param('id') orgId: string,
    @Param('entryId') entryId: string,
    @Body() dto: ApproveEntryDto,
  ) {
    return this.organizationsService.approveEntry(userId, orgId, entryId, dto.note);
  }

  @Put(':id/ledger/:entryId/reject')
  @ApiOperation({ summary: 'Reject a ledger entry (Admin/Accountant only)' })
  @ApiResponse({ status: 200, description: 'Entry rejected successfully' })
  async rejectEntry(
    @CurrentUser('id') userId: string,
    @Param('id') orgId: string,
    @Param('entryId') entryId: string,
    @Body() dto: RejectEntryDto,
  ) {
    return this.organizationsService.rejectEntry(userId, orgId, entryId, dto.note);
  }

  @Get(':id/ledger/duplicates')
  @ApiOperation({ summary: 'Get potential duplicate transactions' })
  @ApiResponse({ status: 200, description: 'Returns duplicate groups' })
  async getDuplicates(
    @CurrentUser('id') userId: string,
    @Param('id') orgId: string,
  ) {
    return this.organizationsService.getDuplicates(userId, orgId);
  }

  @Post(':id/tax-report')
  @ApiOperation({ summary: 'Generate a tax report (Admin/Accountant only)' })
  @ApiResponse({ status: 201, description: 'Tax report generated successfully' })
  async createTaxReport(
    @CurrentUser('id') userId: string,
    @Param('id') orgId: string,
    @Body() dto: CreateTaxReportDto,
  ) {
    return this.organizationsService.createTaxReport(userId, orgId, dto);
  }

  @Get(':id/tax-reports')
  @ApiOperation({ summary: 'Get all tax reports for the organization' })
  @ApiResponse({ status: 200, description: 'Returns list of tax reports' })
  async getTaxReports(
    @CurrentUser('id') userId: string,
    @Param('id') orgId: string,
  ) {
    return this.organizationsService.getTaxReports(userId, orgId);
  }

  @Get(':id/tax-reports/:reportId')
  @ApiOperation({ summary: 'Get detailed tax report' })
  @ApiResponse({ status: 200, description: 'Returns tax report details' })
  async getTaxReport(
    @CurrentUser('id') userId: string,
    @Param('id') orgId: string,
    @Param('reportId') reportId: string,
  ) {
    return this.organizationsService.getTaxReport(userId, orgId, reportId);
  }

  @Get(':id/members/spending')
  @ApiOperation({ summary: 'Get member spending comparison' })
  @ApiResponse({ status: 200, description: 'Returns spending statistics by member' })
  async getMemberSpending(
    @CurrentUser('id') userId: string,
    @Param('id') orgId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.organizationsService.getMemberSpending(userId, orgId, {
      startDate,
      endDate,
    });
  }
}
