import { prisma } from './prisma';

export interface AuditLogData {
  userId?: string;
  action: string;
  entityType: 'TICKET' | 'STUDENT' | 'DRIVER' | 'VEHICLE' | 'RIDE' | 'SETTING' | 'AUTH';
  entityId: string;
  details: Record<string, any>;
  ipAddress?: string;
}

export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        details: JSON.stringify(data.details),
        ipAddress: data.ipAddress,
      },
    });
  } catch (error) {
    // Audit logging should not crash primary operations, but we log the error
    console.error('Failed to create audit log entry:', error);
  }
}
