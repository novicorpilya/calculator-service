export interface FilterPreset {
    id: string;
    user_id: string;
    name: string;
    query_params: Record<string, unknown>;
    is_default: boolean;
    view_type: 'kanban' | 'list' | 'table';
    created_at?: string;
    updated_at?: string;
}
