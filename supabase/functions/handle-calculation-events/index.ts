import { serve } from "std/http/server.ts"
import { createClient } from 'supabase'

/**
 * Handle Calculation Events Edge Function
 * Triggered by DB Webhook when specific events occur in the Event Store.
 */
serve(async (req: Request) => {
    try {
        const payload = await req.json()
        const { type, calculation_id, actor_id } = payload.record || payload;

        console.log(`[EventStore] Processing ${type} for ${calculation_id}`)

        // 1. Initialize Supabase Admin
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 2. Business Logic per Event Type
        if (type === 'calculation.paid') {
            console.log(`🎉 Payment confirmed by manager for project ${calculation_id}. Sending roadmap...`)

            // Fetch Context (using explicit joins same as in repository)
            const { data: calc } = await supabaseAdmin
                .from('calculations')
                .select(`
                    project_number,
                    user_id,
                    client_info:profiles!user_id (first_name),
                    manager_info:profiles!manager_id (first_name, last_name)
                `)
                .eq('id', calculation_id)
                .single() as any;

            const clientName = calc?.client_info?.first_name || 'Клиент';
            const clientId = calc?.user_id;
            const managerName = calc?.manager_info
                ? `${calc.manager_info.first_name} ${calc.manager_info.last_name}`.trim()
                : 'Ваш менеджер';
            const projectNo = calc?.project_number || calculation_id.toString().slice(0, 8);

            const roadmapMessage = `Добрый день, ${clientName}! 🎉

Ваша оплата по заказу №${projectNo} успешно получена и подтверждена менеджером ✅

━━━━━━━━━━━━━━━━━━━

📋 *Ваш план реализации проекта:*

1️⃣ **Закупка инвентаря** (2-5 дней)
   Менеджер формирует заявку на ваши позиции у выбранных поставщиков

2️⃣ **Контроль сборки** (3-7 дней) 
   Мы собираем всё на нашем консолидационном складе

3️⃣ **Логистика**
   Менеджер свяжется с вами для уточнения времени и адреса доставки

4️⃣ **Отправка заказа** 🚚
   Вы получите трек-номер для отслеживания груза

━━━━━━━━━━━━━━━━━━━

⏰ *Ориентировочный срок готовности:* 7-10 рабочих дней

С уважением, 
${managerName}`;

            const { error: insertError } = await supabaseAdmin.from('messages').insert({
                calculation_id: calculation_id,
                content: roadmapMessage,
                sender_id: actor_id,
                receiver_id: clientId,
                is_read: false,
                topic: 'calculation_chat',
                extension: 'text'
            });

            if (insertError) {
                console.error(`[Paid Event] Insert Error: ${insertError.message}`);
                throw new Error(`DB Insert Failed: ${insertError.message}`);
            }
        }

        if (type === 'calculation.created' || type === 'calculation.submitted' || type === 'ACTION_submit') {
            const isSubmit = type === 'calculation.submitted' || type === 'ACTION_submit';
            console.log(`🆕 ${isSubmit ? 'Submission' : 'Creation'} for project ${calculation_id}. Notifying managers...`);

            const { data: calc } = await supabaseAdmin
                .from('calculations')
                .select(`
                    project_number,
                    organization_name,
                    user_id,
                    client_info:profiles!user_id (first_name, last_name)
                `)
                .eq('id', calculation_id)
                .single() as any;

            const clientName = calc?.client_info
                ? `${calc.client_info.first_name} ${calc.client_info.last_name || ''}`.trim()
                : 'Новый клиент';
            const projectNo = calc?.project_number || '—';
            const orgName = calc?.organization_name || 'Не указана';

            const notificationMessage = isSubmit
                ? `🚀 **Новая заявка на аудит!**
                   
                   **Проект:** #${projectNo}
                   **Клиент:** ${clientName}
                   **Организация:** ${orgName}
                   
                   Заявка отправлена на проверку. Пожалуйста, назначьте эксперта.`
                : `📝 **Создан новый черновик расчета**
                   
                   **Проект:** #${projectNo}
                   **Клиент:** ${clientName}
                   **Организация:** ${orgName}`;

            const { error: insertError } = await supabaseAdmin.from('messages').insert({
                calculation_id: calculation_id,
                content: notificationMessage,
                sender_id: actor_id,
                receiver_id: null,
                is_read: false,
                topic: 'system_notification',
                extension: 'text'
            });

            if (insertError) {
                console.error(`[Creation Event] Insert Error: ${insertError.message}`);
                throw new Error(`DB Insert Failed: ${insertError.message}`);
            }
        }

        if (type === 'calculation.expert' || type === 'calculation.assign' || type === 'ACTION_assign') {
            console.log(`👋 Project accepted by manager ${actor_id} for ${calculation_id}`);

            const { data: calc } = await supabaseAdmin
                .from('calculations')
                .select(`
                    id,
                    project_number,
                    user_id,
                    manager_info:profiles!manager_id (first_name, last_name)
                `)
                .eq('id', calculation_id)
                .single() as any;

            const managerName = calc?.manager_info
                ? `${calc.manager_info.first_name} ${calc.manager_info.last_name}`.trim()
                : 'Ваш менеджер';
            const projectNo = calc?.project_number || '—';
            const clientId = calc?.user_id;

            const welcomeMessage = `Здравствуйте! 👋

Ваш проект #${projectNo} принят мной в работу. Меня зовут ${managerName}, я ваш персональный эксперт.

━━━━━━━━━━━━━━━━━━━

📋 *Что я сделаю в рамках аудита:*

🔍 **Проверю нормы** расхода под ваши типы поверхностей
💬 **Оптимизирую** список товаров по цене и износостойкости
💰 **Подготовлю окончательное** коммерческое предложение
📋 **Выставлю счёт** после согласования спецификации

Обычно ручной аудит занимает **от 1 до 4 рабочих часов**. Как только я закончу проверку, вы получите уведомление здесь в чате.

━━━━━━━━━━━━━━━━━━━

Если у вас есть фото помещений или спецификации от прошлых поставщиков — присылайте их сюда, это поможет сделать расчет еще точнее. 😊`;

            const { error: insertError } = await supabaseAdmin.from('messages').insert({
                calculation_id: calculation_id,
                content: welcomeMessage,
                sender_id: actor_id,
                receiver_id: clientId,
                is_read: false,
                topic: 'calculation_chat',
                extension: 'text'
            });

            if (insertError) {
                console.error(`[Expert Event] Insert Error: ${insertError.message}`);
                throw new Error(`DB Insert Failed: ${insertError.message}`);
            }
        }

        // 3. Update Event Status
        const eventId = payload.event_id || payload.id || payload.record?.id;
        if (eventId) {
            const { error: updateError } = await supabaseAdmin
                .from('calculation_audit_log')
                .update({ metadata: { ...(payload.metadata || {}), processed: true, processed_at: new Date().toISOString() } })
                .eq('id', eventId);

            if (updateError) console.error(`[EventStore] Status Update Error: ${updateError.message}`);
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        })
    } catch (err: unknown) {
        const error = err as Error;
        console.error(`[EdgeFunction Error] ${error.message}`);

        // If we have an error, let's try to mark it as failed in event_store
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { "Content-Type": "application/json" },
            status: 400,
        })
    }
})
