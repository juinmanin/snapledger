import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrganizationDto } from '../dto/create-organization.dto';
import { UpdateOrganizationDto } from '../dto/update-organization.dto';
import { InviteMemberDto } from '../dto/invite-member.dto';
import { CreateTaxReportDto } from '../dto/create-tax-report.dto';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async createOrganization(userId: string, dto: CreateOrganizationDto) {
    // Create organization
    const organization = await this.prisma.organization.create({
      data: {
        name: dto.name,
        type: dto.type,
        country: dto.country || 'KR',
        currency: dto.currency || 'KRW',
        taxId: dto.taxId,
        fiscalYearStartMonth: dto.fiscalYearStartMonth || 1,
        members: {
          create: {
            userId: userId,
            role: 'ADMIN',
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return organization;
  }

  async getOrganizations(userId: string) {
    const memberships = await this.prisma.orgMember.findMany({
      where: { userId },
      include: {
        organization: {
          include: {
            members: true,
          },
        },
      },
    });

    return memberships.map((m) => ({
      ...m.organization,
      myRole: m.role,
      myJoinedAt: m.joinedAt,
    }));
  }

  async getOrganization(userId: string, orgId: string) {
    await this.checkMembership(userId, orgId);

    const organization = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            consolidatedEntries: true,
            taxReports: true,
            orgBudgets: true,
          },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  async updateOrganization(userId: string, orgId: string, dto: UpdateOrganizationDto) {
    await this.checkRole(userId, orgId, ['ADMIN']);

    const organization = await this.prisma.organization.update({
      where: { id: orgId },
      data: dto,
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return organization;
  }

  async inviteMember(userId: string, orgId: string, dto: InviteMemberDto) {
    await this.checkRole(userId, orgId, ['ADMIN', 'ACCOUNTANT']);

    // Find user by email
    const invitedUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!invitedUser) {
      throw new NotFoundException('User not found with this email');
    }

    // Check if already a member
    const existingMember = await this.prisma.orgMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId: invitedUser.id,
        },
      },
    });

    if (existingMember) {
      throw new BadRequestException('User is already a member of this organization');
    }

    const member = await this.prisma.orgMember.create({
      data: {
        organizationId: orgId,
        userId: invitedUser.id,
        role: dto.role,
        spendingLimit: dto.spendingLimit,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return member;
  }

  async removeMember(userId: string, orgId: string, targetUserId: string) {
    await this.checkRole(userId, orgId, ['ADMIN']);

    // Cannot remove yourself
    if (userId === targetUserId) {
      throw new BadRequestException('Cannot remove yourself from the organization');
    }

    // Check if target is a member
    const member = await this.prisma.orgMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId: targetUserId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    await this.prisma.orgMember.delete({
      where: { id: member.id },
    });

    return { success: true, message: 'Member removed successfully' };
  }

  async getMembers(userId: string, orgId: string) {
    await this.checkMembership(userId, orgId);

    const members = await this.prisma.orgMember.findMany({
      where: { organizationId: orgId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            country: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return members;
  }

  async getLedger(
    userId: string,
    orgId: string,
    filters?: {
      startDate?: string;
      endDate?: string;
      memberId?: string;
      categoryId?: string;
      status?: string;
      skip?: number;
      take?: number;
    }
  ) {
    await this.checkMembership(userId, orgId);

    const where: any = { organizationId: orgId };

    if (filters?.memberId) {
      where.memberId = filters.memberId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      where.transaction = {
        date: {},
      };
      if (filters.startDate) {
        where.transaction.date.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.transaction.date.lte = new Date(filters.endDate);
      }
    }

    if (filters?.categoryId) {
      where.transaction = {
        ...where.transaction,
        categoryId: filters.categoryId,
      };
    }

    const entries = await this.prisma.consolidatedLedger.findMany({
      where,
      include: {
        transaction: {
          include: {
            category: true,
            receipt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: filters?.skip || 0,
      take: filters?.take || 50,
    });

    return entries;
  }

  async getLedgerSummary(userId: string, orgId: string, filters?: { startDate?: string; endDate?: string }) {
    await this.checkMembership(userId, orgId);

    const where: any = { organizationId: orgId };

    if (filters?.startDate || filters?.endDate) {
      where.transaction = {
        date: {},
      };
      if (filters.startDate) {
        where.transaction.date.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.transaction.date.lte = new Date(filters.endDate);
      }
    }

    const entries = await this.prisma.consolidatedLedger.findMany({
      where,
      include: {
        transaction: {
          include: {
            category: true,
          },
        },
      },
    });

    // Group by category
    const byCategory: Record<string, { name: string; total: number; count: number; deductible: number }> = {};
    // Group by member
    const byMember: Record<string, { total: number; count: number; deductible: number }> = {};

    let totalIncome = 0;
    let totalExpense = 0;
    let totalDeductible = 0;

    for (const entry of entries) {
      const amount = entry.transaction.amount;
      const categoryName = entry.transaction.category?.name || 'Uncategorized';
      const categoryId = entry.transaction.categoryId || 'uncategorized';

      // By category
      if (!byCategory[categoryId]) {
        byCategory[categoryId] = { name: categoryName, total: 0, count: 0, deductible: 0 };
      }
      byCategory[categoryId].total += amount;
      byCategory[categoryId].count += 1;
      if (entry.deductible) {
        byCategory[categoryId].deductible += amount;
      }

      // By member
      if (!byMember[entry.memberId]) {
        byMember[entry.memberId] = { total: 0, count: 0, deductible: 0 };
      }
      byMember[entry.memberId].total += amount;
      byMember[entry.memberId].count += 1;
      if (entry.deductible) {
        byMember[entry.memberId].deductible += amount;
      }

      // Totals
      if (entry.transaction.type === 'income') {
        totalIncome += amount;
      } else if (entry.transaction.type === 'expense') {
        totalExpense += amount;
      }

      if (entry.deductible) {
        totalDeductible += amount;
      }
    }

    return {
      totalIncome,
      totalExpense,
      totalDeductible,
      netBalance: totalIncome - totalExpense,
      byCategory: Object.entries(byCategory).map(([id, data]) => ({ categoryId: id, ...data })),
      byMember: Object.entries(byMember).map(([id, data]) => ({ memberId: id, ...data })),
      totalEntries: entries.length,
    };
  }

  async approveEntry(userId: string, orgId: string, entryId: string, note?: string) {
    await this.checkRole(userId, orgId, ['ADMIN', 'ACCOUNTANT']);

    const entry = await this.prisma.consolidatedLedger.findUnique({
      where: { id: entryId },
    });

    if (!entry || entry.organizationId !== orgId) {
      throw new NotFoundException('Entry not found');
    }

    const updated = await this.prisma.consolidatedLedger.update({
      where: { id: entryId },
      data: {
        status: 'APPROVED',
        approvedBy: userId,
        approvedAt: new Date(),
        note: note || entry.note,
      },
      include: {
        transaction: true,
      },
    });

    return updated;
  }

  async rejectEntry(userId: string, orgId: string, entryId: string, note: string) {
    await this.checkRole(userId, orgId, ['ADMIN', 'ACCOUNTANT']);

    const entry = await this.prisma.consolidatedLedger.findUnique({
      where: { id: entryId },
    });

    if (!entry || entry.organizationId !== orgId) {
      throw new NotFoundException('Entry not found');
    }

    const updated = await this.prisma.consolidatedLedger.update({
      where: { id: entryId },
      data: {
        status: 'REJECTED',
        approvedBy: userId,
        approvedAt: new Date(),
        note,
      },
      include: {
        transaction: true,
      },
    });

    return updated;
  }

  async getDuplicates(userId: string, orgId: string) {
    await this.checkMembership(userId, orgId);

    // Find potential duplicates based on same amount and date within 5 minutes
    const entries = await this.prisma.consolidatedLedger.findMany({
      where: { organizationId: orgId },
      include: {
        transaction: {
          include: {
            receipt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const duplicateGroups: any[] = [];
    const processed = new Set<string>();

    for (let i = 0; i < entries.length; i++) {
      if (processed.has(entries[i].id)) continue;

      const current = entries[i];
      const group = [current];

      for (let j = i + 1; j < entries.length; j++) {
        if (processed.has(entries[j].id)) continue;

        const other = entries[j];

        // Check if similar (same amount, similar time, same merchant)
        if (
          Math.abs(current.transaction.amount - other.transaction.amount) < 0.01 &&
          Math.abs(
            new Date(current.transaction.date).getTime() - new Date(other.transaction.date).getTime()
          ) <
            5 * 60 * 1000 && // 5 minutes
          current.transaction.merchantName === other.transaction.merchantName
        ) {
          group.push(other);
          processed.add(other.id);
        }
      }

      if (group.length > 1) {
        duplicateGroups.push({
          amount: current.transaction.amount,
          date: current.transaction.date,
          merchant: current.transaction.merchantName,
          entries: group,
        });
        processed.add(current.id);
      }
    }

    return duplicateGroups;
  }

  async createTaxReport(userId: string, orgId: string, dto: CreateTaxReportDto) {
    await this.checkRole(userId, orgId, ['ADMIN', 'ACCOUNTANT']);

    // Calculate date range based on period
    const { startDate, endDate } = this.parsePeriod(dto.period, dto.type);

    // Get all ledger entries in the period
    const entries = await this.prisma.consolidatedLedger.findMany({
      where: {
        organizationId: orgId,
        status: 'APPROVED',
        transaction: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      include: {
        transaction: true,
      },
    });

    let totalIncome = 0;
    let totalExpense = 0;
    let deductibleSum = 0;

    for (const entry of entries) {
      if (entry.transaction.type === 'income') {
        totalIncome += entry.transaction.amount;
      } else if (entry.transaction.type === 'expense') {
        totalExpense += entry.transaction.amount;
      }

      if (entry.deductible && entry.deductionRate) {
        deductibleSum += entry.transaction.amount * entry.deductionRate;
      } else if (entry.deductible) {
        deductibleSum += entry.transaction.amount;
      }
    }

    // Simple tax estimation (would be more complex in reality)
    const taxableIncome = totalIncome - deductibleSum;
    const estimatedTax = Math.max(0, taxableIncome * 0.15); // Simplified 15% rate
    const estimatedSaving = deductibleSum * 0.15;

    const report = await this.prisma.taxReport.create({
      data: {
        organizationId: orgId,
        period: dto.period,
        type: dto.type,
        totalIncome,
        totalExpense,
        deductibleSum,
        estimatedTax,
        estimatedSaving,
      },
    });

    return report;
  }

  async getTaxReports(userId: string, orgId: string) {
    await this.checkMembership(userId, orgId);

    const reports = await this.prisma.taxReport.findMany({
      where: { organizationId: orgId },
      orderBy: { generatedAt: 'desc' },
    });

    return reports;
  }

  async getTaxReport(userId: string, orgId: string, reportId: string) {
    await this.checkMembership(userId, orgId);

    const report = await this.prisma.taxReport.findUnique({
      where: { id: reportId },
    });

    if (!report || report.organizationId !== orgId) {
      throw new NotFoundException('Tax report not found');
    }

    return report;
  }

  async getMemberSpending(userId: string, orgId: string, filters?: { startDate?: string; endDate?: string }) {
    await this.checkMembership(userId, orgId);

    const where: any = { organizationId: orgId };

    if (filters?.startDate || filters?.endDate) {
      where.transaction = {
        date: {},
      };
      if (filters.startDate) {
        where.transaction.date.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.transaction.date.lte = new Date(filters.endDate);
      }
    }

    const entries = await this.prisma.consolidatedLedger.findMany({
      where,
      include: {
        transaction: true,
      },
    });

    const memberStats: Record<string, { total: number; count: number; avgAmount: number }> = {};

    for (const entry of entries) {
      if (!memberStats[entry.memberId]) {
        memberStats[entry.memberId] = { total: 0, count: 0, avgAmount: 0 };
      }
      memberStats[entry.memberId].total += entry.transaction.amount;
      memberStats[entry.memberId].count += 1;
    }

    // Calculate averages
    for (const memberId in memberStats) {
      memberStats[memberId].avgAmount = memberStats[memberId].total / memberStats[memberId].count;
    }

    // Get member details
    const members = await this.prisma.orgMember.findMany({
      where: { organizationId: orgId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return members.map((member) => ({
      ...member,
      spending: memberStats[member.userId] || { total: 0, count: 0, avgAmount: 0 },
    }));
  }

  // Helper methods
  private async checkMembership(userId: string, orgId: string) {
    const member = await this.prisma.orgMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId: userId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    return member;
  }

  private async checkRole(userId: string, orgId: string, allowedRoles: string[]) {
    const member = await this.checkMembership(userId, orgId);

    if (!allowedRoles.includes(member.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return member;
  }

  private parsePeriod(period: string, type: string): { startDate: Date; endDate: Date } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (type === 'MONTHLY') {
      // Format: YYYY-MM
      const [year, month] = period.split('-').map(Number);
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0); // Last day of month
    } else if (type === 'QUARTERLY') {
      // Format: YYYY-Q1, YYYY-Q2, etc.
      const [yearStr, quarterStr] = period.split('-');
      const year = parseInt(yearStr);
      const quarter = parseInt(quarterStr.replace('Q', ''));
      const startMonth = (quarter - 1) * 3;
      startDate = new Date(year, startMonth, 1);
      endDate = new Date(year, startMonth + 3, 0); // Last day of quarter
    } else {
      // Yearly
      const year = parseInt(period);
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31);
    }

    return { startDate, endDate };
  }
}
