import axios from 'axios';

export default {
    name: 'ai',
    description: 'Chat with AI (powered by OpenAI)',
    usage: '.ai <your question>',
    category: 'AI',

    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        const question = args.join(' ');

        if (!question) {
            await sock.sendMessage(jid, {
                text: '❌ *Please provide a question!*\n\nUsage: `.ai What is Node.js?`',
            }, { quoted: msg });
            return;
        }

        const apiKey = process.env.OPENAI_API_KEY;

        try {
            await sock.sendMessage(jid, { react: { text: '🤔', key: msg.key } });

            let response;
            // Try OpenAI if configured properly
            if (apiKey && apiKey !== 'sk-your-openai-api-key-here') {
                try {
                    response = await callOpenAI(apiKey, question);
                } catch (openAiErr) {
                    console.log('OpenAI failed, falling back to free API...');
                    response = await callFreeAI(question);
                }
            } else {
                // Instantly use free API if no OpenAI key
                response = await callFreeAI(question);
            }

            await sock.sendMessage(jid, {
                text: `🤖 *AI Response*\n\n${response}`,
            }, { quoted: msg });

            await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });
        } catch (err) {
            console.error('AI error:', err.message);
            await sock.sendMessage(jid, {
                text: `❌ *AI request failed!*\n\nError: ${err.message}\n\n_Please try again later._`,
            }, { quoted: msg });
            await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
        }
    },
};

async function callOpenAI(apiKey, question) {
    const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful WhatsApp bot assistant. Keep responses concise and formatted for WhatsApp (use * for bold, _ for italic). Maximum 500 words.',
                },
                { role: 'user', content: question },
            ],
            max_tokens: 1000,
            temperature: 0.7,
        },
        {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        }
    );

    return response.data.choices[0].message.content.trim();
}

async function callFreeAI(question) {
    try {
        const response = await axios.get(
            `https://chatgpt.apinepdev.workers.dev/?question=${encodeURIComponent(question)}`,
            { timeout: 30000 }
        );
        if (response.data && response.data.answer) {
            return response.data.answer;
        }
        throw new Error("Invalid response format from Free AI");
    } catch(err) {
        throw new Error("AI endpoints are currently experiencing high load. Please try again.");
    }
}
