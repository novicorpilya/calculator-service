import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const managerId = '80710648-5eef-44ed-a01e-36f72d9def2c';

async function testGemini() {
    console.log('--- Starting Gemini Test ---');
    
    // Fetch data like the service does
    const [projectsRes, reviewsRes] = await Promise.all([
        supabase.from('calculations').select('status, results').eq('manager_id', managerId),
        supabase.from('calculation_reviews').select('rating, comment').eq('calculations.manager_id', managerId)
    ]);

    const projects = projectsRes.data || [];
    const reviews = reviewsRes.data || [];
    const activeProjects = projects.filter(p => p.status !== 'completed' && p.status !== 'closed');
    const avgRating = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 5;

    console.log(`Data: ${activeProjects.length} active projects, ${avgRating.toFixed(1)} avg rating`);

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Ты - Senior AI Expert Consultant. Дай 3 кратких совета для менеджера. Активных проектов: ${activeProjects.length}, Рейтинг: ${avgRating.toFixed(2)}. Верни ТОЛЬКО JSON массив {id, type, title, content, actionLabel, priority}.`;

    try {
        const result = await model.generateContent(prompt);
        console.log('Gemini Response:', result.response.text());
    } catch (err) {
        console.error('Gemini Error:', err);
    }
}

testGemini();
