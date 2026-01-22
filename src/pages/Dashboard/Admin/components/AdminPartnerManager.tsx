import React, { useState, useEffect, useCallback } from 'react';
import {
    Plug,
    Plus,
    Copy,
    Check,
    Trash2,
    ExternalLink,
    Key,
    Users,
    TrendingUp,
    Eye,
    EyeOff,
    Code,
    RefreshCw,
    AlertTriangle,
    Settings,
    Globe,
    X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useServices } from '@/app/di/ServiceContainer';
import type { Partner, PartnerLead, CreatePartnerResult } from '@/services/partner.service';

// ============================================================
// Subcomponents
// ============================================================

const PartnerCard: React.FC<{
    partner: Partner;
    onDelete: (id: string) => void;
    onToggleActive: (id: string, isActive: boolean) => void;
    onCopyEmbed: (partner: Partner) => void;
    onSettings: (partner: Partner) => void;
}> = ({ partner, onDelete, onToggleActive, onCopyEmbed, onSettings }) => {
    const domainCount = partner.allowed_domains?.length || 0;

    return (
        <div className="bg-card border border-border-theme rounded-2xl p-6 hover:shadow-lg hover:shadow-primary/5 transition-all group">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${partner.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'}`}
                    >
                        {partner.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-bold text-foreground">{partner.name}</h3>
                        <p className="text-xs text-muted-foreground">
                            Создан: {new Date(partner.created_at).toLocaleDateString('ru-RU')}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {domainCount > 0 && (
                        <div className="px-2 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-500 flex items-center gap-1">
                            <Globe size={10} />
                            {domainCount} домен{domainCount > 1 ? 'а' : ''}
                        </div>
                    )}
                    <div
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${partner.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}
                    >
                        {partner.is_active ? 'Активен' : 'Отключен'}
                    </div>
                </div>
            </div>

            {/* Stats row */}
            {partner.request_count > 0 && (
                <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                        Запросов:{' '}
                        <strong className="text-foreground">{partner.request_count}</strong>
                    </span>
                    {partner.last_request_at && (
                        <span>
                            Последний: {new Date(partner.last_request_at).toLocaleString('ru-RU')}
                        </span>
                    )}
                </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
                <button
                    onClick={() => onCopyEmbed(partner)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-bold transition-all"
                >
                    <Code size={14} />
                    Код вставки
                </button>
                <button
                    onClick={() => onSettings(partner)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-xl text-xs font-bold transition-all"
                >
                    <Settings size={14} />
                    Настройки
                </button>
                <button
                    onClick={() => onToggleActive(partner.id, !partner.is_active)}
                    className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-bold transition-all"
                >
                    {partner.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                    {partner.is_active ? 'Отключить' : 'Включить'}
                </button>
                <button
                    onClick={() => onDelete(partner.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-xs font-bold transition-all"
                >
                    <Trash2 size={14} />
                    Удалить
                </button>
            </div>
        </div>
    );
};

const LeadRow: React.FC<{ lead: PartnerLead }> = ({ lead }) => {
    return (
        <tr className="border-b border-border-theme/50 hover:bg-muted/30 transition-colors">
            <td className="px-4 py-3 text-sm text-foreground">{lead.partner?.name || 'N/A'}</td>
            <td className="px-4 py-3 text-sm text-foreground">{lead.client_email || '—'}</td>
            <td className="px-4 py-3 text-sm text-foreground">{lead.client_phone || '—'}</td>
            <td className="px-4 py-3 text-sm text-muted-foreground">{lead.facility_type || '—'}</td>
            <td className="px-4 py-3 text-sm text-foreground font-medium">
                {lead.estimated_total
                    ? `₽${Number(lead.estimated_total).toLocaleString('ru-RU')}`
                    : '—'}
            </td>
            <td className="px-4 py-3 text-xs text-muted-foreground">
                {new Date(lead.created_at).toLocaleString('ru-RU')}
            </td>
        </tr>
    );
};

const EmbedCodeModal: React.FC<{
    partner: Partner | null;
    onClose: () => void;
}> = ({ partner, onClose }) => {
    const [copied, setCopied] = useState(false);

    if (!partner) return null;

    const baseUrl = window.location.origin;
    const embedUrl = `${baseUrl}/embed/calculator?partner=${partner.id}`;
    const iframeCode = `<iframe 
    src="${embedUrl}" 
    width="100%" 
    height="800" 
    frameborder="0" 
    style="border: none; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.1);"
    allow="clipboard-write"
></iframe>

<script>
    // Auto-resize iframe based on content
    window.addEventListener('message', function(e) {
        if (e.data && e.data.type === 'HICS_RESIZE') {
            document.querySelector('iframe').style.height = e.data.height + 'px';
        }
    });
</script>`;

    const handleCopy = () => {
        navigator.clipboard.writeText(iframeCode);
        setCopied(true);
        toast.success('Код скопирован в буфер обмена');
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="bg-card border border-border-theme rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 border-b border-border-theme">
                    <h2 className="text-xl font-black flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <Code className="text-primary" size={20} />
                        </div>
                        Код для вставки — {partner.name}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-2">
                        Скопируйте код ниже и вставьте на целевой сайт партнера.
                    </p>
                </div>

                <div className="p-6">
                    <div className="relative">
                        <pre className="bg-zinc-950 text-emerald-400 p-4 rounded-xl text-xs overflow-x-auto font-mono whitespace-pre-wrap">
                            {iframeCode}
                        </pre>
                        <button
                            onClick={handleCopy}
                            className="absolute top-3 right-3 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                        >
                            {copied ? (
                                <Check size={16} className="text-emerald-400" />
                            ) : (
                                <Copy size={16} className="text-white/60" />
                            )}
                        </button>
                    </div>

                    <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3">
                        <AlertTriangle className="text-amber-500 shrink-0" size={20} />
                        <div className="text-sm text-muted-foreground">
                            <strong className="text-amber-500">Важно:</strong> Партнер должен
                            разместить этот код на HTTPS-сайте. Все лиды будут автоматически
                            привязаны к партнеру <strong>{partner.name}</strong>.
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-border-theme flex justify-end gap-3">
                    <a
                        href={embedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-5 py-2.5 bg-muted hover:bg-muted/80 rounded-xl text-sm font-bold transition-all"
                    >
                        <ExternalLink size={16} />
                        Открыть превью
                    </a>
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all"
                    >
                        Закрыть
                    </button>
                </div>
            </div>
        </div>
    );
};

const NewApiKeyModal: React.FC<{
    result: CreatePartnerResult | null;
    onClose: () => void;
}> = ({ result, onClose }) => {
    const [copied, setCopied] = useState(false);

    if (!result) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(result.apiKey);
        setCopied(true);
        toast.success('API-ключ скопирован');
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="bg-card border border-border-theme rounded-3xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 border-b border-border-theme">
                    <h2 className="text-xl font-black flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 rounded-xl">
                            <Key className="text-emerald-500" size={20} />
                        </div>
                        Партнер создан!
                    </h2>
                </div>

                <div className="p-6">
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
                        <p className="text-sm text-red-400 font-bold flex items-center gap-2">
                            <AlertTriangle size={16} />
                            Сохраните API-ключ! Он показывается только один раз.
                        </p>
                    </div>

                    <div className="relative">
                        <div className="bg-zinc-950 text-emerald-400 p-4 rounded-xl font-mono text-sm break-all">
                            {result.apiKey}
                        </div>
                        <button
                            onClick={handleCopy}
                            className="absolute top-3 right-3 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                        >
                            {copied ? (
                                <Check size={16} className="text-emerald-400" />
                            ) : (
                                <Copy size={16} className="text-white/60" />
                            )}
                        </button>
                    </div>

                    <p className="text-xs text-muted-foreground mt-4">
                        Партнер: <strong className="text-foreground">{result.partner.name}</strong>
                    </p>
                </div>

                <div className="p-6 border-t border-border-theme flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all"
                    >
                        Понятно, закрыть
                    </button>
                </div>
            </div>
        </div>
    );
};

// ============================================================
// Main Component
// ============================================================

export const AdminPartnerManager: React.FC = () => {
    const { partnerService } = useServices();

    const [partners, setPartners] = useState<Partner[]>([]);
    const [leads, setLeads] = useState<PartnerLead[]>([]);
    const [loading, setLoading] = useState(true);
    const [newPartnerName, setNewPartnerName] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [embedModalPartner, setEmbedModalPartner] = useState<Partner | null>(null);
    const [newKeyResult, setNewKeyResult] = useState<CreatePartnerResult | null>(null);
    const [settingsPartner, setSettingsPartner] = useState<Partner | null>(null);
    const [domainInput, setDomainInput] = useState('');

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [partnersRes, leadsRes] = await Promise.all([
                partnerService.getPartners(),
                partnerService.getPartnerLeads(),
            ]);

            if (partnersRes.success) setPartners(partnersRes.data || []);
            if (leadsRes.success) setLeads(leadsRes.data || []);
        } catch (err) {
            console.error(err);
            toast.error('Ошибка загрузки данных партнеров');
        } finally {
            setLoading(false);
        }
    }, [partnerService]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleCreatePartner = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPartnerName.trim()) return;

        try {
            const res = await partnerService.createPartner(newPartnerName.trim());
            if (res.success && res.data) {
                setNewKeyResult(res.data);
                setNewPartnerName('');
                setShowAddModal(false);
                loadData();
                toast.success(`Партнер "${res.data.partner.name}" создан`);
            } else {
                toast.error(res.error?.message || 'Ошибка создания партнера');
            }
        } catch {
            toast.error('Критическая ошибка');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Удалить этого партнера? Все связанные лиды останутся в системе.')) return;

        const res = await partnerService.deletePartner(id);
        if (res.success) {
            toast.success('Партнер удален');
            loadData();
        } else {
            toast.error(res.error?.message || 'Ошибка удаления');
        }
    };

    const handleToggleActive = async (id: string, isActive: boolean) => {
        const res = await partnerService.updatePartner(id, { is_active: isActive });
        if (res.success) {
            toast.success(isActive ? 'Партнер активирован' : 'Партнер отключен');
            loadData();
        } else {
            toast.error(res.error?.message || 'Ошибка обновления');
        }
    };

    if (loading && partners.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-violet-500/20 to-purple-500/10 rounded-2xl text-violet-500 ring-1 ring-violet-500/20 shadow-lg shadow-violet-500/10">
                            <Plug size={24} />
                        </div>
                        Интеграции и Партнеры
                    </h2>
                    <p className="text-muted-foreground mt-2 text-sm font-medium ml-1 max-w-lg">
                        Управление внешними подключениями к калькулятору. Генерация API-ключей и
                        отслеживание лидов.
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={loadData}
                        className="p-3 bg-muted hover:bg-muted/80 rounded-xl transition-all"
                        title="Обновить"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                    >
                        <Plus size={18} />
                        Добавить партнера
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-card border border-border-theme rounded-2xl p-5 flex items-center gap-4">
                    <div className="p-3 bg-violet-500/10 rounded-xl">
                        <Users className="text-violet-500" size={20} />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-foreground">{partners.length}</p>
                        <p className="text-xs text-muted-foreground font-medium">Партнеров</p>
                    </div>
                </div>
                <div className="bg-card border border-border-theme rounded-2xl p-5 flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 rounded-xl">
                        <Key className="text-emerald-500" size={20} />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-foreground">
                            {partners.filter((p) => p.is_active).length}
                        </p>
                        <p className="text-xs text-muted-foreground font-medium">Активных ключей</p>
                    </div>
                </div>
                <div className="bg-card border border-border-theme rounded-2xl p-5 flex items-center gap-4">
                    <div className="p-3 bg-amber-500/10 rounded-xl">
                        <TrendingUp className="text-amber-500" size={20} />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-foreground">{leads.length}</p>
                        <p className="text-xs text-muted-foreground font-medium">Лидов получено</p>
                    </div>
                </div>
            </div>

            {/* Partners Grid */}
            <div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">
                    Партнеры
                </h3>
                {partners.length === 0 ? (
                    <div className="bg-card border border-dashed border-border-theme rounded-2xl p-12 text-center">
                        <Plug className="mx-auto text-muted-foreground/30 mb-4" size={48} />
                        <p className="text-muted-foreground font-medium">
                            Нет подключенных партнеров
                        </p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="mt-4 text-primary text-sm font-bold hover:underline"
                        >
                            Добавить первого партнера
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {partners.map((partner) => (
                            <PartnerCard
                                key={partner.id}
                                partner={partner}
                                onDelete={handleDelete}
                                onToggleActive={handleToggleActive}
                                onCopyEmbed={setEmbedModalPartner}
                                onSettings={setSettingsPartner}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Leads Table */}
            <div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">
                    Последние лиды
                </h3>
                {leads.length === 0 ? (
                    <div className="bg-card border border-dashed border-border-theme rounded-2xl p-8 text-center">
                        <p className="text-muted-foreground font-medium">Лидов пока нет</p>
                    </div>
                ) : (
                    <div className="bg-card border border-border-theme rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                            Партнер
                                        </th>
                                        <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                            Email
                                        </th>
                                        <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                            Телефон
                                        </th>
                                        <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                            Тип объекта
                                        </th>
                                        <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                            Сумма
                                        </th>
                                        <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                            Дата
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leads.map((lead) => (
                                        <LeadRow key={lead.id} lead={lead} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Partner Modal */}
            {showAddModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
                    onClick={() => setShowAddModal(false)}
                >
                    <div
                        className="bg-card border border-border-theme rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-border-theme">
                            <h2 className="text-xl font-black">Новый партнер</h2>
                        </div>
                        <form onSubmit={handleCreatePartner} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                                    Название компании
                                </label>
                                <input
                                    type="text"
                                    value={newPartnerName}
                                    onChange={(e) => setNewPartnerName(e.target.value)}
                                    placeholder="Например: GlobalDistro"
                                    className="w-full px-4 py-3 bg-background border border-border-theme rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                                    autoFocus
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-5 py-2.5 bg-muted hover:bg-muted/80 rounded-xl text-sm font-bold transition-all"
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    disabled={!newPartnerName.trim()}
                                    className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
                                >
                                    Создать
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Embed Code Modal */}
            <EmbedCodeModal
                partner={embedModalPartner}
                onClose={() => setEmbedModalPartner(null)}
            />

            {/* New API Key Modal */}
            <NewApiKeyModal result={newKeyResult} onClose={() => setNewKeyResult(null)} />

            {/* Partner Settings Modal */}
            {settingsPartner && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
                    onClick={() => setSettingsPartner(null)}
                >
                    <div
                        className="bg-card border border-border-theme rounded-3xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-border-theme flex items-center justify-between">
                            <h2 className="text-xl font-black flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-xl">
                                    <Settings className="text-blue-500" size={20} />
                                </div>
                                Настройки — {settingsPartner.name}
                            </h2>
                            <button
                                onClick={() => setSettingsPartner(null)}
                                className="p-2 hover:bg-muted rounded-lg transition-all"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Domain Whitelisting Section */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                                    <Globe className="inline mr-2" size={12} />
                                    Разрешённые домены
                                </label>
                                <p className="text-xs text-muted-foreground mb-3">
                                    Если указаны домены, калькулятор будет работать только на этих
                                    сайтах. Пустой список = доступ со всех сайтов.
                                </p>

                                {/* Current domains */}
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {(settingsPartner.allowed_domains || []).map((domain, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 text-blue-500 rounded-lg text-xs font-medium"
                                        >
                                            {domain}
                                            <button
                                                onClick={async () => {
                                                    const newDomains =
                                                        settingsPartner.allowed_domains.filter(
                                                            (_, i) => i !== idx
                                                        );
                                                    const res = await partnerService.updatePartner(
                                                        settingsPartner.id,
                                                        { allowed_domains: newDomains }
                                                    );
                                                    if (res.success && res.data) {
                                                        setSettingsPartner(res.data);
                                                        loadData();
                                                        toast.success('Домен удален');
                                                    }
                                                }}
                                                className="ml-1 p-0.5 hover:bg-blue-500/20 rounded transition-all"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                    {(!settingsPartner.allowed_domains ||
                                        settingsPartner.allowed_domains.length === 0) && (
                                        <span className="text-xs text-muted-foreground italic">
                                            Нет ограничений (все домены разрешены)
                                        </span>
                                    )}
                                </div>

                                {/* Add domain input */}
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={domainInput}
                                        onChange={(e) => setDomainInput(e.target.value)}
                                        placeholder="example.com"
                                        className="flex-1 px-4 py-2.5 bg-background border border-border-theme rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        onKeyDown={async (e) => {
                                            if (e.key === 'Enter' && domainInput.trim()) {
                                                e.preventDefault();
                                                const newDomains = [
                                                    ...(settingsPartner.allowed_domains || []),
                                                    domainInput.trim(),
                                                ];
                                                const res = await partnerService.updatePartner(
                                                    settingsPartner.id,
                                                    { allowed_domains: newDomains }
                                                );
                                                if (res.success && res.data) {
                                                    setSettingsPartner(res.data);
                                                    setDomainInput('');
                                                    loadData();
                                                    toast.success('Домен добавлен');
                                                }
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={async () => {
                                            if (!domainInput.trim()) return;
                                            const newDomains = [
                                                ...(settingsPartner.allowed_domains || []),
                                                domainInput.trim(),
                                            ];
                                            const res = await partnerService.updatePartner(
                                                settingsPartner.id,
                                                { allowed_domains: newDomains }
                                            );
                                            if (res.success && res.data) {
                                                setSettingsPartner(res.data);
                                                setDomainInput('');
                                                loadData();
                                                toast.success('Домен добавлен');
                                            }
                                        }}
                                        className="px-4 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="bg-muted/50 rounded-xl p-4">
                                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                                    Статистика
                                </p>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Запросов:</span>
                                        <span className="ml-2 font-bold text-foreground">
                                            {settingsPartner.request_count || 0}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Последний:</span>
                                        <span className="ml-2 font-bold text-foreground">
                                            {settingsPartner.last_request_at
                                                ? new Date(
                                                      settingsPartner.last_request_at
                                                  ).toLocaleDateString('ru-RU')
                                                : '—'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-border-theme flex justify-end">
                            <button
                                onClick={() => setSettingsPartner(null)}
                                className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all"
                            >
                                Готово
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
