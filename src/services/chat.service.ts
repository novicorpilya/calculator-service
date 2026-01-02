import { supabase } from './supabase'

export interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    image_url?: string;
    created_at: string;
    is_read: boolean;
    calculation_id?: string;
    sender?: {
        organization_name: string;
        avatar_url?: string;
    };
}

export const chatService = {
    async uploadAttachment(file: File): Promise<string> {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `chat/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('attachments')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('attachments')
            .getPublicUrl(filePath);

        return publicUrl;
    },

    async getCalculationMessages(calculationId: string): Promise<Message[]> {
        const { data, error } = await supabase
            .from('messages')
            .select('*, sender:profiles!sender_id(organization_name)')
            .eq('calculation_id', calculationId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    /**
     * Fetch direct messages between users (Global Hub mode)
     */
    async getDirectMessages(senderId: string, receiverId: string): Promise<Message[]> {
        const { data, error } = await supabase
            .from('messages')
            .select('*, sender:profiles!sender_id(organization_name)')
            .or(`and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`)
            .is('calculation_id', null)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    /**
     * Send a new message
     */
    async sendMessage(payload: Omit<Message, 'id' | 'created_at' | 'is_read'>): Promise<Message> {
        const { data, error } = await supabase
            .from('messages')
            .insert([{
                ...payload,
                is_read: false
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Subscribe to real-time messages for a calculation or globally
     */
    subscribeToMessages(callback: (message: Message) => void, calculationId?: string) {
        // Note: Row-level filters in Supabase Realtime work best via channel settings

        const channel = supabase.channel('chat_updates')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: calculationId ? `calculation_id=eq.${calculationId}` : undefined
                },
                (payload) => {
                    callback(payload.new as Message);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    },

    /**
     * Mark messages as read
     */
    async markAsRead(messageIds: string[]) {
        const { error } = await supabase
            .from('messages')
            .update({ is_read: true })
            .in('id', messageIds);

        if (error) throw error;
    },

    /**
     * Get available chat participants based on user role
     */
    /**
     * Get available chat participants based on user role and project assignments.
     * Logic: Clients see assigned managers + admins. Managers see their clients + admins.
     */
    async getRecipients(currentUserId: string, role: string) {
        if (role === 'admin') {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, organization_name, role')
                .neq('id', currentUserId)
                .order('organization_name', { ascending: true });
            if (error) throw error;
            return data || [];
        }

        // Fetch all admins for support
        const { data: admins, error: adminError } = await supabase
            .from('profiles')
            .select('id, organization_name, role')
            .eq('role', 'admin');

        if (adminError) throw adminError;

        if (role === 'client') {
            // Managers assigned to this client's projects
            const { data: projects, error } = await supabase
                .from('calculations')
                .select('manager:profiles!manager_id(id, organization_name, role)')
                .eq('user_id', currentUserId)
                .not('manager_id', 'is', null);

            if (error) throw error;

            const managers = (projects || [])
                .filter(p => p.manager)
                .map(p => {
                    const m = p.manager as unknown as { id: string; organization_name: string; role: string } | { id: string; organization_name: string; role: string }[];
                    return Array.isArray(m) ? m[0] : m;
                })
                .filter(Boolean);

            // Unify admins and managers
            const recipientsMap = new Map<string, { id: string; organization_name: string; role: string }>();
            [...(admins || []), ...managers].forEach(r => recipientsMap.set(r.id, r));
            return Array.from(recipientsMap.values());
        }

        if (role === 'manager') {
            // Clients whose projects this manager is handling
            const { data: projects, error } = await supabase
                .from('calculations')
                .select('client:profiles!user_id(id, organization_name, role)')
                .eq('manager_id', currentUserId);

            if (error) throw error;

            const clients = (projects || [])
                .filter(p => p.client)
                .map(p => {
                    const c = p.client as unknown as { id: string; organization_name: string; role: string } | { id: string; organization_name: string; role: string }[];
                    return Array.isArray(c) ? c[0] : c;
                })
                .filter(Boolean);

            // Unify admins and clients
            const recipientsMap = new Map<string, { id: string; organization_name: string; role: string }>();
            [...(admins || []), ...clients].forEach(r => recipientsMap.set(r.id, r));
            return Array.from(recipientsMap.values());
        }

        return admins || [];
    },

    /**
     * Subscribe to real-time updates for calculations (status, manager assignment)
     */
    subscribeToCalculations(callback: () => void, filter?: string) {
        const channel = supabase.channel('calc_status_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'calculations',
                    filter: filter
                },
                () => {
                    callback();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }
}
