/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { logger, type ILogger } from '@/core/logging';

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
        // If full mock container is provided (e.g. in tests), return it combined with defaults if needed
        // For partial mocks, we instantiate defaults and override

        // 1. Infrastructure Layer
        const chatRepo = new ChatRepository(supabase, logger);
        const broadcast = new BroadcastService(supabase);
        const presence = new PresenceService(supabase);
        const calcRepo = new CalculationRepository(supabase, logger);
        const filterRepo = new FilterPresetRepository(supabase);

        // 2. Cross-cutting / Infrastructure Services
        const audit = new AuditLogService(supabase);
        const email = new EmailService(supabase);
        const config = new ConfigService(supabase);

        // 3. Application Services
        const chat = new ChatService(chatRepo, broadcast);
        const version = new VersionService(supabase);
        const calculation = new CalculationService(calcRepo, version, config);

        const admin = new AdminService(supabase, audit);
        const venue = new VenueService(supabase);
        const inventory = new InventoryService(supabase);
        const supplier = new SupplierService(supabase, audit);
        const inventoryAdmin = new InventoryAdminService(supabase, audit);
        const partner = new PartnerService(supabase);

        const document = new DocumentService(supabase);
        const notification = new NotificationService(supabase);
        const managerDashboard = new ManagerDashboardService(supabase);
        const review = new ReviewService(supabase);
        const filterPreset = new FilterPresetService(filterRepo);

        const defaultServices = {
            chatService: chat,
            presenceService: presence,
            logger,
            calculationService: calculation,
            auditLogService: audit,
            adminService: admin,
            emailService: email,
            venueService: venue,
            inventoryService: inventory,
            versionService: version,
            documentService: document,
            notificationService: notification,
            managerDashboardService: managerDashboard,
            reviewService: review,
            filterPresetService: filterPreset,
            supplierService: supplier,
            inventoryAdminService: inventoryAdmin,
            configService: config,
            partnerService: partner,
        };

        return { ...defaultServices, ...services };
    }, [services]);

    return <ServiceContext.Provider value={container}>{children}</ServiceContext.Provider>;
};

export const useServices = () => {
    const context = useContext(ServiceContext);
    if (!context) throw new Error('useServices must be used within a ServiceProvider');
    return context;
};
