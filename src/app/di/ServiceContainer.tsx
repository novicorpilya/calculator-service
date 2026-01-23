/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useMemo } from 'react';
import { supabase } from '@/services/supabase.service';
import { logger, type ILogger } from '@/core/logging/index.ts';

// Repositories
import { ChatRepository } from '@/features/chat/repositories/ChatRepository';
import { CalculationRepository } from '@/features/dashboard/repositories/CalculationRepository';
import { FilterPresetRepository } from '@/features/dashboard/manager/repositories/FilterPresetRepository';

// Services
import { ChatService, type IChatService } from '@/features/chat/services/ChatService';
import { BroadcastService } from '@/features/chat/services/BroadcastService';
import { PresenceService, type IPresenceService } from '@/features/chat/services/PresenceService';
import {
    CalculationService,
    type ICalculationService,
} from '@/features/dashboard/services/CalculationService';
import {
    VersionService,
    type IVersionService,
} from '@/features/dashboard/manager/services/version.service';
import { AuditLogService, type IAuditLogService } from '@/services/audit.service';
import { AdminService, type IAdminService } from '@/services/admin.service';
import { EmailService, type IEmailService } from '@/services/email.service';
import { VenueService, type IVenueService } from '@/services/venue.service';
import { InventoryService, type IInventoryService } from '@/services/inventory.service';
import {
    DocumentService,
    type IDocumentService,
} from '@/features/dashboard/manager/services/document.service';
import {
    NotificationService,
    type INotificationService,
} from '@/features/dashboard/services/notification.service';
import {
    ManagerDashboardService,
    type IManagerDashboardService,
} from '@/features/dashboard/manager/services/dashboard.service';
import { ReviewService, type IReviewService } from '@/services/review.service';
import {
    FilterPresetService,
    type IFilterPresetService,
} from '@/features/dashboard/manager/services/FilterPresetService';
import { SupplierService, type ISupplierService } from '@/services/supplier.service';
import {
    InventoryAdminService,
    type IInventoryAdminService,
} from '@/services/inventory-admin.service';
import { ConfigService, type IConfigService } from '@/services/config.service';
import { PartnerService, type IPartnerService } from '@/services/partner.service';

interface IServiceContainer {
    chatService: IChatService;
    presenceService: IPresenceService;
    logger: ILogger;
    calculationService: ICalculationService;
    auditLogService: IAuditLogService;
    adminService: IAdminService;
    emailService: IEmailService;
    venueService: IVenueService;
    inventoryService: IInventoryService;
    versionService: IVersionService;
    documentService: IDocumentService;
    notificationService: INotificationService;
    managerDashboardService: IManagerDashboardService;
    reviewService: IReviewService;
    filterPresetService: IFilterPresetService;
    supplierService: ISupplierService;
    inventoryAdminService: IInventoryAdminService;
    configService: IConfigService;
    partnerService: IPartnerService;
}

const ServiceContext = createContext<IServiceContainer | null>(null);

/**
 * ServiceContainer - Production Grade DI
 * Provides explicit orchestration of dependencies.
 */
// Allow injection of mock services for testing
export const ServiceProvider: React.FC<{
    children: React.ReactNode;
    services?: Partial<IServiceContainer>;
}> = ({ children, services }) => {
    const container = useMemo<IServiceContainer>(() => {
        // Default services container with logger pre-initialized
        const defaultServices = {
            logger,
        } as unknown as IServiceContainer;

        // Define lazy getters for each service to avoid immediate dependency instantiation
        const defineLazyService = <K extends keyof IServiceContainer>(
            key: K,
            factory: () => IServiceContainer[K]
        ) => {
            let instance: IServiceContainer[K] | null = null;
            Object.defineProperty(defaultServices, key, {
                get: () => {
                    if (!instance) {
                        instance = factory();
                    }
                    return instance;
                },
                enumerable: true,
                configurable: true,
            });
        };

        // Infrastructure & Cross-cutting
        defineLazyService('auditLogService', () => new AuditLogService(supabase));
        defineLazyService('emailService', () => new EmailService(supabase));
        defineLazyService('configService', () => new ConfigService(supabase));
        defineLazyService('partnerService', () => new PartnerService(supabase));

        // Application Layer (The heavy stuff)
        defineLazyService('chatService', () => {
            const chatRepo = new ChatRepository(supabase, logger);
            const broadcast = new BroadcastService(supabase);
            return new ChatService(chatRepo, broadcast);
        });

        defineLazyService('presenceService', () => new PresenceService(supabase));

        defineLazyService('calculationService', () => {
            const calcRepo = new CalculationRepository(supabase, logger);
            const version = new VersionService(supabase);
            const config = new ConfigService(supabase);
            return new CalculationService(calcRepo, version, config);
        });

        defineLazyService(
            'adminService',
            () => new AdminService(supabase, new AuditLogService(supabase))
        );
        defineLazyService('venueService', () => new VenueService(supabase));
        defineLazyService('inventoryService', () => new InventoryService(supabase));
        defineLazyService('versionService', () => new VersionService(supabase));
        defineLazyService('documentService', () => new DocumentService(supabase));
        defineLazyService('notificationService', () => new NotificationService(supabase));
        defineLazyService('managerDashboardService', () => new ManagerDashboardService(supabase));
        defineLazyService('reviewService', () => new ReviewService(supabase));
        defineLazyService('filterPresetService', () => {
            const filterRepo = new FilterPresetRepository(supabase);
            return new FilterPresetService(filterRepo);
        });
        defineLazyService(
            'supplierService',
            () => new SupplierService(supabase, new AuditLogService(supabase))
        );
        defineLazyService(
            'inventoryAdminService',
            () => new InventoryAdminService(supabase, new AuditLogService(supabase))
        );

        return { ...defaultServices, ...services } as IServiceContainer;
    }, [services]);

    return <ServiceContext.Provider value={container}>{children}</ServiceContext.Provider>;
};

export const useServices = () => {
    const context = useContext(ServiceContext);
    if (!context) throw new Error('useServices must be used within a ServiceProvider');
    return context;
};
