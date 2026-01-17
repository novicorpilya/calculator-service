/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useMemo } from 'react';
import { supabase } from '@/services/supabase';
import { ChatRepository } from '@/features/chat/repositories/ChatRepository';
import { ChatService, type IChatService } from '@/features/chat/services/ChatService';
import { BroadcastService } from '@/features/chat/services/BroadcastService';
import { logger, type ILogger } from '@/core/logging';
import { CalculationRepository } from '@/features/dashboard/repositories/CalculationRepository';
import {
    CalculationService,
    type ICalculationService,
} from '@/features/dashboard/services/CalculationService';

import { PresenceService, type IPresenceService } from '@/features/chat/services/PresenceService';
import { AuditLogService, type IAuditLogService } from '@/services/audit.service';
import { AdminService, type IAdminService } from '@/services/admin.service';
import { EmailService, type IEmailService } from '@/services/email.service';
import { VenueService, type IVenueService } from '@/services/venue.service';
import { InventoryService, type IInventoryService } from '@/services/inventory.service';
import { SupplierService, type ISupplierService } from '@/services/supplier.service';
import { InventoryAdminService, type IInventoryAdminService } from '@/services/inventory-admin.service';

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
    supplierService: ISupplierService;
    inventoryAdminService: IInventoryAdminService;
}

const ServiceContext = createContext<IServiceContainer | null>(null);

interface ServiceProviderProps {
    children: React.ReactNode;
    services?: Partial<IServiceContainer>;
}

export const ServiceProvider: React.FC<ServiceProviderProps> = ({ children, services }) => {
    const container = useMemo(() => {
        if (services) {
            const activeLogger = services.logger || logger;
            const chatRepo = new ChatRepository(supabase, activeLogger);
            const broadcastService = new BroadcastService(supabase);
            const presenceService = services.presenceService || new PresenceService(supabase);
            const calculationRepo = new CalculationRepository(supabase, activeLogger);

            const auditLogService = services.auditLogService || new AuditLogService(supabase);
            const adminService =
                services.adminService || new AdminService(supabase, auditLogService);
            const emailService = services.emailService || new EmailService(supabase);
            const venueService = services.venueService || new VenueService(supabase);
            const inventoryService = services.inventoryService || new InventoryService(supabase);
            const supplierService = services.supplierService || new SupplierService(supabase, auditLogService);
            const inventoryAdminService = services.inventoryAdminService || new InventoryAdminService(supabase, auditLogService);

            const chatService = services.chatService || new ChatService(chatRepo, broadcastService);
            const calculationService =
                services.calculationService || new CalculationService(calculationRepo);

            return {
                chatService,
                presenceService,
                logger: activeLogger,
                calculationService,
                auditLogService,
                adminService,
                emailService,
                venueService,
                inventoryService,
                supplierService,
                inventoryAdminService,
                ...services,
            } as IServiceContainer;
        }

        // Infrastructure Layer
        const chatRepo = new ChatRepository(supabase, logger);
        const broadcastService = new BroadcastService(supabase);
        const presenceService = new PresenceService(supabase);
        const calculationRepo = new CalculationRepository(supabase, logger);

        // Application Layer
        const auditLogService = new AuditLogService(supabase);
        const adminService = new AdminService(supabase, auditLogService);
        const emailService = new EmailService(supabase);

        const chatService = new ChatService(chatRepo, broadcastService);
        const venueService = new VenueService(supabase);
        const inventoryService = new InventoryService(supabase);
        const supplierService = new SupplierService(supabase, auditLogService);
        const inventoryAdminService = new InventoryAdminService(supabase, auditLogService);
        // CalculationService - only needs repository
        const calculationService = new CalculationService(calculationRepo);

        return {
            chatService,
            presenceService,
            logger,
            calculationService,
            auditLogService,
            adminService,
            emailService,
            venueService,
            inventoryService,
            supplierService,
            inventoryAdminService,
        };
    }, [services]);

    return <ServiceContext.Provider value={container}>{children}</ServiceContext.Provider>;
};

export const useServices = () => {
    const context = useContext(ServiceContext);
    if (!context) {
        throw new Error('useServices must be used within a ServiceProvider');
    }
    return context;
};
