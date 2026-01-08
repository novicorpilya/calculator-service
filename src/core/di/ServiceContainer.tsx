import React, { createContext, useContext, useMemo } from 'react';
import { supabase } from '@/services/supabase';
import { ChatRepository } from '@/features/chat/repositories/ChatRepository';
import { ChatService, type IChatService } from '@/features/chat/services/ChatService';
import { BroadcastService } from '@/features/chat/services/BroadcastService';
import { LogManager, LogLevel } from '@/core/logging/LogManager';
import { CalculationRepository } from '@/features/dashboard/repositories/CalculationRepository';
import { CalculationService, type ICalculationService } from '@/features/dashboard/services/CalculationService';
import { AuditService } from '@/core/audit/AuditService';

import { PresenceService, type IPresenceService } from '@/features/chat/services/PresenceService';
import { AuditLogService, type IAuditLogService } from '@/services/audit.service';
import { AdminService, type IAdminService } from '@/services/admin.service';
import { EmailService, type IEmailService } from '@/services/email.service';
import { VenueService, type IVenueService } from '@/services/venue.service';
import { InventoryService, type IInventoryService } from '@/services/inventory.service';
import { SupplierService, type ISupplierService } from '@/services/supplier.service';

interface IServiceContainer {
    chatService: IChatService;
    presenceService: IPresenceService; // Use Interface
    logger: LogManager;
    calculationService: ICalculationService;
    auditService: AuditService; // Keep the display one for now or merge
    auditLogService: IAuditLogService;
    adminService: IAdminService;
    emailService: IEmailService;
    venueService: IVenueService;
    inventoryService: IInventoryService;
    supplierService: ISupplierService;
}

const ServiceContext = createContext<IServiceContainer | null>(null);

interface ServiceProviderProps {
    children: React.ReactNode;
    services?: Partial<IServiceContainer>;
}

export const ServiceProvider: React.FC<ServiceProviderProps> = ({ children, services }) => {
    const container = useMemo(() => {
        if (services) {
            // In tests, we can provide partial mocks. 
            // We fill missing services with real ones only if they don't depend on missing infrastructure.
            // For simplicity in this demo, if services prop is provided, we assume it's fully or sufficiently mocked.
            // But let's build a safe merger.

            const logger = services.logger || new LogManager(
                import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.INFO
            );

            const chatRepo = new ChatRepository(supabase, logger);
            const broadcastService = new BroadcastService(supabase);
            const presenceService = services.presenceService || new PresenceService(supabase);
            const calculationRepo = new CalculationRepository(supabase, logger);

            const auditService = services.auditService || new AuditService();
            const auditLogService = services.auditLogService || new AuditLogService(supabase);
            const adminService = services.adminService || new AdminService(supabase, auditLogService);
            const emailService = services.emailService || new EmailService(supabase);
            const venueService = services.venueService || new VenueService(supabase);
            const inventoryService = services.inventoryService || new InventoryService(supabase);
            const supplierService = services.supplierService || new SupplierService(supabase);

            const chatService = services.chatService || new ChatService(chatRepo, broadcastService);
            const calculationService = services.calculationService || new CalculationService(calculationRepo, chatService);

            return {
                chatService,
                presenceService,
                logger,
                calculationService,
                auditService,
                auditLogService,
                adminService,
                emailService,
                venueService,
                inventoryService,
                supplierService,
                ...services // Ensure passed overrides are final
            } as IServiceContainer;
        }

        // Infrastructure Layer
        const logger = new LogManager(
            import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.INFO
        );
        const chatRepo = new ChatRepository(supabase, logger);
        const broadcastService = new BroadcastService(supabase);
        const presenceService = new PresenceService(supabase);

        const calculationRepo = new CalculationRepository(supabase, logger);

        // Application Layer
        const auditService = new AuditService();
        const auditLogService = new AuditLogService(supabase);
        const adminService = new AdminService(supabase, auditLogService);
        const emailService = new EmailService(supabase);

        const chatService = new ChatService(chatRepo, broadcastService);
        const venueService = new VenueService(supabase);
        const inventoryService = new InventoryService(supabase);
        const supplierService = new SupplierService(supabase);
        // CalculationService теперь получает chatService через DI
        const calculationService = new CalculationService(calculationRepo, chatService);

        return {
            chatService,
            presenceService,
            logger,
            calculationService,
            auditService,
            auditLogService,
            adminService,
            emailService,
            venueService,
            inventoryService,
            supplierService,
        };
    }, [services]);

    return (
        <ServiceContext.Provider value={container}>
            {children}
        </ServiceContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useServices = () => {
    const context = useContext(ServiceContext);
    if (!context) {
        throw new Error('useServices must be used within a ServiceProvider');
    }
    return context;
};
