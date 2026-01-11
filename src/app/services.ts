import { supabase } from '@/services/supabase';
import { LogManager, LogLevel } from '@/core/logging/LogManager';

// Repositories
import { ChatRepository } from '@/features/chat/repositories/ChatRepository';
import { CalculationRepository } from '@/features/dashboard/repositories/CalculationRepository';

// Services
import { ChatService } from '@/features/chat/services/ChatService';
import { BroadcastService } from '@/features/chat/services/BroadcastService';
import { CalculationService } from '@/features/dashboard/services/CalculationService';
import { VenueService } from '@/services/venue.service';
import { InventoryService } from '@/services/inventory.service';
import { SupplierService } from '@/services/supplier.service';

/**
 * Singleton instances of Domain Services.
 * This replaces the complex ServiceContainer context for standard usage.
 * Components should access logic via Hooks, which use these instances.
 */

export const logger = new LogManager(
    import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.INFO
);

// Chat & Presence Infrastructure
export const broadcastService = new BroadcastService(supabase);
export const chatRepository = new ChatRepository(supabase, logger);
export const chatService = new ChatService(chatRepository, broadcastService);

// Domain Services
export const calculationRepository = new CalculationRepository(supabase, logger);
export const calculationService = new CalculationService(calculationRepository);

export const venueService = new VenueService(supabase);
export const inventoryService = new InventoryService(supabase);
export const supplierService = new SupplierService(supabase);
